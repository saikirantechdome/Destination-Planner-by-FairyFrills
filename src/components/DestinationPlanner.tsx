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

interface Place {
  name: string;
  description: string;
  image_url: string;
  distance: string;
  keywords: string[];
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

export function DestinationPlanner() {
  const [placeName, setPlaceName] = useState('');
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [isSearching, setIsSearching] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<TripRequest | null>(null);
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
    if (!placeName || !fromDate || !toDate) {
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
        status: 'pending'
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
                const fromDate = new Date(currentRequest.from_date);
                const toDate = new Date(currentRequest.to_date);
                const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                const places = currentRequest.results as Place[];
                const placesPerDay = Math.ceil(places.length / diffDays);

                return Array.from({ length: diffDays }, (_, dayIndex) => {
                  const startIndex = dayIndex * placesPerDay;
                  const endIndex = Math.min(startIndex + placesPerDay, places.length);
                  const dayPlaces = places.slice(startIndex, endIndex);

                  if (dayPlaces.length === 0) return null;

                  return (
                    <div key={dayIndex} className="space-y-4">
                      <h3 className="text-xl font-semibold text-primary">Day {dayIndex + 1}:</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {dayPlaces.map((place, index) => (
                          <Card key={startIndex + index} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="aspect-video bg-muted flex items-center justify-center">
                              {place.image_url ? (
                                <img 
                                  src={place.image_url} 
                                  alt={place.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder.svg';
                                  }}
                                />
                              ) : (
                                <div className="text-center text-muted-foreground">
                                  <MapPinIcon className="h-12 w-12 mx-auto mb-2" />
                                  <p className="text-sm">Image not available</p>
                                </div>
                              )}
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-lg mb-2">{place.name}</h3>
                              <p className="text-sm text-muted-foreground mb-3">{place.distance}</p>
                              <p className="text-sm mb-4">{place.description}</p>
                              <div className="flex flex-wrap gap-1">
                                {place.keywords.slice(0, 4).map((keyword, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                }).filter(Boolean);
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

          {/* Default State */}
          {!currentRequest && !isSearching && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <div className="text-6xl mb-4">🌍</div>
                <h3 className="text-xl font-semibold mb-2">Ready to explore?</h3>
                <p>Enter your destination and dates to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}