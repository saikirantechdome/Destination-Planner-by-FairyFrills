import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, MapPinIcon, SearchIcon, LoaderIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { TripPlanDetails } from '@/components/TripPlanDetails';

interface Activity {
  title: string;
  description: string;
}

interface DayPlan {
  day: string;
  activities: Activity[];
}

interface TripRequest {
  id: string;
  place_name: string;
  from_date: string;
  to_date: string;
  status: string;
  results: any;
  created_at: string;
}

interface Destination {
  name: string;
  image: string;
  tagline: string;
}

const trendingDestinations = {
  'Less than 5 Days': [
    { name: 'Dubai', image: 'https://destinationplanner.blob.core.windows.net/tripplan/Dubai_min_37d495697d.png', tagline: 'Luxury meets tradition' },
    { name: 'Singapore', image: 'https://destinationplanner.blob.core.windows.net/tripplan/New_Zealand_min_bd852c07d1.png', tagline: 'Garden city perfection' },
    { name: 'Bali', image: 'https://destinationplanner.blob.core.windows.net/tripplan/Bali%201STCARD.png', tagline: 'Island paradise' },
    { name: 'Sri Lanka', image: 'https://destinationplanner.blob.core.windows.net/tripplan/Srilanka_min_1_1116f72816_3013a482e8.png', tagline: 'Pearl of the Indian Ocean' },
    { name: 'Malaysia', image: 'https://destinationplanner.blob.core.windows.net/tripplan/Malaysia_min_14ae4e76cc_106f0987d5%20(1).png', tagline: 'Truly Asia' },
    { name: 'Vietnam', image: 'https://destinationplanner.blob.core.windows.net/tripplan/Vietnam_min_9b4fb245d7.png', tagline: 'Breathtaking landscapes' },
    { name: 'Thailand', image: 'https://destinationplanner.blob.core.windows.net/tripplan/Thailand_min_5b98b41c89.png', tagline: 'Land of smiles' }
  ],
  '5–8 Days': [
    { name: 'Vietnam', image: 'https://destinationplanner.blob.core.windows.net/tripplan/Vietnam_min_9b4fb245d7.png', tagline: 'Breathtaking landscapes' },
    { name: 'Thailand', image: 'https://destinationplanner.blob.core.windows.net/tripplan/Thailand_min_5b98b41c89.png', tagline: 'Land of smiles' },
    { name: 'Mauritius', image: 'https://destinationplanner.blob.core.windows.net/tripplan/Mauritius_min_68238a83af_0c4b918181.png', tagline: 'Tropical paradise' },
    { name: 'Australia', image: 'https://destinationplanner.blob.core.windows.net/tripplan/AUSTRAILA%201STCARD.png', tagline: 'Down under adventures' }
  ],
  '10+ Days': [
    { name: 'New Zealand', image: 'https://destinationplanner.blob.core.windows.net/tripplan/New_Zealand_min_bd852c07d1.png', tagline: 'Adventure capital' },
    { name: 'Europe', image: 'https://destinationplanner.blob.core.windows.net/tripplan/Europe_min_02633788f0.png', tagline: 'Historic wonders' },
    { name: 'United Kingdom', image: 'https://destinationplanner.blob.core.windows.net/tripplan/united_kingdom_d153b14c67.png', tagline: 'Royal heritage' },
    { name: 'Scandinavia', image: 'https://destinationplanner.blob.core.windows.net/tripplan/scandinavia_842d6c6455.png', tagline: 'Nordic beauty' }
  ]
};

const bestPicks = [
  { name: 'Mauritius', image: 'https://destinationplanner.blob.core.windows.net/secondcard/mauritiusSECONDCARD.png' },
  { name: 'Malaysia', image: 'https://destinationplanner.blob.core.windows.net/secondcard/malaysiaSECONDCARD.png' },
  { name: 'Sri Lanka', image: 'https://destinationplanner.blob.core.windows.net/secondcard/SRILANKA%20SECONDCRAD.png' },
  { name: 'Thailand', image: 'https://destinationplanner.blob.core.windows.net/secondcard/THAILALAND%202ND%20CARD.png' },
  { name: 'Maldives', image: 'https://destinationplanner.blob.core.windows.net/secondcard/seychellesSECOND%20CARD.png' },
  { name: 'Australia', image: 'https://destinationplanner.blob.core.windows.net/secondcard/Australia%20SECONDCARD.png' },
  { name: 'France', image: 'https://destinationplanner.blob.core.windows.net/secondcard/franceSECONDCARD.png' },
  { name: 'Norway', image: 'https://destinationplanner.blob.core.windows.net/secondcard/NORWAYSECONDCARD.png' },
  { name: 'Switzerland', image: 'https://destinationplanner.blob.core.windows.net/secondcard/SWITHERLAND%20SECONDCARD.png' },
  { name: 'Finland', image: 'https://destinationplanner.blob.core.windows.net/secondcard/FINLANDSECONDCARD.png' }
];

export function DestinationPlanner() {
  const { user } = useAuth();
  const [placeName, setPlaceName] = useState('');
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [isSearching, setIsSearching] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<TripRequest | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('Less than 5 Days');
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isToDatePickerOpen, setIsToDatePickerOpen] = useState(false);
  const { toast } = useToast();

  // Poll for results every 5 seconds when searching
  useEffect(() => {
    if (!currentRequest || currentRequest.status === 'completed') return;

    const pollInterval = setInterval(async () => {
      const { data, error } = await supabase
        .from('trip_requests')
        .select('*')
        .eq('id', currentRequest.id)
        .single();

      if (error) {
        console.error('Error polling for results:', error);
        return;
      }

      if (data) {
        setCurrentRequest(data);
        if (data.status === 'completed') {
          setIsSearching(false);
          toast({
            title: "Search Complete!",
            description: `Found ${Array.isArray(data.results) ? data.results.length : 0} amazing places for your trip.`,
          });
        }
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [currentRequest, toast]);

  const handleSearch = async () => {
    if (!placeName || !fromDate || !toDate || !user) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before searching.",
        variant: "destructive",
      });
      return;
    }

    if (toDate < fromDate) {
      toast({
        title: "Invalid Date Range",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    const { data, error } = await supabase
      .from('trip_requests')
      .insert({
        place_name: placeName,
        from_date: format(fromDate, 'yyyy-MM-dd'),
        to_date: format(toDate, 'yyyy-MM-dd'),
        status: 'pending',
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating trip request:', error);
      toast({
        title: "Search Failed",
        description: "Failed to start search. Please try again.",
        variant: "destructive",
      });
      setIsSearching(false);
      return;
    }

    setCurrentRequest(data);
    toast({
      title: "Searching...",
      description: "Finding the best places for your trip. This may take a moment.",
    });
  };

  const resetSearch = () => {
    setCurrentRequest(null);
    setIsSearching(false);
    setPlaceName('');
    setFromDate(undefined);
    setToDate(undefined);
  };

  const handleDestinationClick = (destinationName: string) => {
    setSelectedDestination(destinationName);
  };

  const handleBackToDestinations = () => {
    setSelectedDestination(null);
  };

  const cardsPerView = 4;
  const currentDestinations = trendingDestinations[activeFilter as keyof typeof trendingDestinations];
  const maxSlides = Math.max(0, currentDestinations.length - cardsPerView);

  const nextSlide = () => {
    setCurrentSlide(prev => Math.min(prev + 1, maxSlides));
  };

  const prevSlide = () => {
    setCurrentSlide(prev => Math.max(prev - 1, 0));
  };

  if (selectedDestination) {
    return (
      <TripPlanDetails 
        destination={selectedDestination} 
        onBack={handleBackToDestinations} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="flex h-screen">
        {/* Left Side - Search Form */}
        <div className="w-1/3 p-6 bg-card shadow-lg overflow-y-auto border-r">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              Destination Planner by FairyFrills
            </h1>
            <h2 className="text-xl font-semibold text-foreground mb-1">
              Plan Your Trip
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter your destination and travel dates to get personalized recommendations
            </p>
          </div>

          {/* Search Form */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Destination</label>
              <Input
                placeholder="Eg:- Dubai, New York, Hyderabad"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                disabled={isSearching}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fromDate && "text-muted-foreground"
                      )}
                      disabled={isSearching}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "PPP") : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={(date) => {
                        setFromDate(date);
                        if (date) {
                          setIsToDatePickerOpen(true);
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Popover open={isToDatePickerOpen} onOpenChange={setIsToDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !toDate && "text-muted-foreground"
                      )}
                      disabled={isSearching}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={(date) => {
                        setToDate(date);
                        if (date) {
                          setIsToDatePickerOpen(false);
                        }
                      }}
                      disabled={(date) => date < new Date() || (fromDate && date < fromDate)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleSearch} 
                disabled={isSearching}
                className="w-full"
              >
                {isSearching ? (
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <SearchIcon className="mr-2 h-4 w-4" />
                    Search Places
                  </>
                )}
              </Button>
              {currentRequest && (
                <Button variant="outline" onClick={resetSearch} className="w-full">
                  New Search
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Results */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Search Status */}
          {isSearching && (
            <Card className="border-primary/20 bg-primary/5 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <LoaderIcon className="h-5 w-5 animate-spin text-primary" />
                  <div>
                    <p className="font-medium">Searching for best places...</p>
                    <p className="text-sm text-muted-foreground">
                      We're analyzing your destination to find the most amazing spots
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {currentRequest?.status === 'completed' && Array.isArray(currentRequest.results) && currentRequest.results.length > 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">
                  Recommended Places for {currentRequest.place_name}
                </h2>
                <p className="text-muted-foreground">
                  {format(new Date(currentRequest.from_date), "MMM d")} - {format(new Date(currentRequest.to_date), "MMM d, yyyy")}
                </p>
              </div>

              {(() => {
                const dayPlans = currentRequest.results as DayPlan[];
                
                return dayPlans.map((dayPlan, dayIndex) => (
                  <div key={dayIndex} className="space-y-4">
                    <h3 className="text-xl font-semibold text-primary">{dayPlan.day}</h3>
                    <div className="space-y-4">
                      {dayPlan.activities.map((activity, activityIndex) => (
                        <Card key={activityIndex} className="w-full">
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-lg mb-2">{activity.title}</h3>
                            <p className="text-sm">{activity.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}

          {/* No Results */}
          {currentRequest?.status === 'completed' && (!Array.isArray(currentRequest.results) || currentRequest.results.length === 0) && (
            <Card className="text-center py-12">
              <CardContent>
                <MapPinIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No places found</h3>
                <p className="text-muted-foreground">
                  We couldn't find any recommendations for this destination. Try searching for a different location.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Default State - Trending Destinations & Best Picks */}
          {!currentRequest && !isSearching && (
            <div className="space-y-8">
              {/* Trending Destinations Section */}
              <div>
                <h2 className="text-2xl font-bold mb-6">TRENDING DESTINATIONS</h2>
                
                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {Object.keys(trendingDestinations).map((filter) => (
                    <Button
                      key={filter}
                      variant={activeFilter === filter ? "default" : "outline"}
                      onClick={() => setActiveFilter(filter)}
                      className="text-sm"
                    >
                      {filter}
                    </Button>
                  ))}
                </div>

                {/* Navigation Controls */}
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={prevSlide}
                      disabled={currentSlide === 0}
                      className="h-8 w-8"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={nextSlide}
                      disabled={currentSlide >= maxSlides}
                      className="h-8 w-8"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Cards Container */}
                  <div className="overflow-hidden">
                    <div 
                      className="flex gap-4 transition-transform duration-300 ease-in-out"
                      style={{ transform: `translateX(-${currentSlide * (288 + 16)}px)` }}
                    >
                      {currentDestinations.map((destination, index) => (
                        <Card 
                          key={index} 
                          className="w-72 flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => handleDestinationClick(destination.name)}
                        >
                          <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                            <img 
                              src={destination.image} 
                              alt={destination.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-lg">{destination.name}</h3>
                            <p className="text-sm text-muted-foreground">{destination.tagline}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Best Picks Section */}
              <div>
                <h2 className="text-2xl font-bold mb-6">BEST PICKS</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {bestPicks.map((destination, index) => (
                    <Card 
                      key={index} 
                      className="cursor-pointer hover:shadow-lg transition-shadow group"
                      onClick={() => handleDestinationClick(destination.name)}
                    >
                      <div className="aspect-square bg-muted rounded-t-lg overflow-hidden">
                        <img 
                          src={destination.image} 
                          alt={destination.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium text-center">{destination.name}</h3>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}