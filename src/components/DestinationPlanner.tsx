import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, MapPinIcon, SearchIcon, LoaderIcon } from 'lucide-react';
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
    { name: 'Dubai', image: '/placeholder.svg', tagline: 'Luxury meets tradition' },
    { name: 'Singapore', image: '/placeholder.svg', tagline: 'Garden city perfection' },
    { name: 'Bali', image: '/placeholder.svg', tagline: 'Island paradise' },
    { name: 'Sri Lanka', image: '/placeholder.svg', tagline: 'Pearl of the Indian Ocean' },
    { name: 'Malaysia', image: '/placeholder.svg', tagline: 'Truly Asia' },
    { name: 'Vietnam', image: '/placeholder.svg', tagline: 'Breathtaking landscapes' },
    { name: 'Thailand', image: '/placeholder.svg', tagline: 'Land of smiles' }
  ],
  '5–8 Days': [
    { name: 'Vietnam', image: '/placeholder.svg', tagline: 'Breathtaking landscapes' },
    { name: 'Thailand', image: '/placeholder.svg', tagline: 'Land of smiles' },
    { name: 'Mauritius', image: '/placeholder.svg', tagline: 'Tropical paradise' },
    { name: 'Australia', image: '/placeholder.svg', tagline: 'Down under adventures' }
  ],
  '10+ Days': [
    { name: 'New Zealand', image: '/placeholder.svg', tagline: 'Adventure capital' },
    { name: 'Europe', image: '/placeholder.svg', tagline: 'Historic wonders' },
    { name: 'United Kingdom', image: '/placeholder.svg', tagline: 'Royal heritage' },
    { name: 'Scandinavia', image: '/placeholder.svg', tagline: 'Nordic beauty' }
  ]
};

const bestPicks = [
  { name: 'Mauritius', image: '/placeholder.svg' },
  { name: 'Malaysia', image: '/placeholder.svg' },
  { name: 'Sri Lanka', image: '/placeholder.svg' },
  { name: 'Thailand', image: '/placeholder.svg' },
  { name: 'Maldives', image: '/placeholder.svg' },
  { name: 'Australia', image: '/placeholder.svg' },
  { name: 'France', image: '/placeholder.svg' },
  { name: 'Norway', image: '/placeholder.svg' },
  { name: 'Switzerland', image: '/placeholder.svg' },
  { name: 'Finland', image: '/placeholder.svg' }
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
                placeholder="e.g., Dubai, New York, Hyderabad"
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
                      onSelect={setFromDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Popover>
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
                      onSelect={setToDate}
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

                {/* Horizontal Scroll Cards */}
                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-4 min-w-max">
                    {trendingDestinations[activeFilter as keyof typeof trendingDestinations].map((destination, index) => (
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