import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface TripPlanDetailsProps {
  destination: string;
  onBack: () => void;
}

export function TripPlanDetails({ destination, onBack }: TripPlanDetailsProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Destinations
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{destination} Trip Plan</CardTitle>
            <CardDescription>
              Detailed trip planning for your {destination} adventure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">Trip Details Coming Soon</h3>
              <p className="text-muted-foreground">
                This is a placeholder for the detailed trip plan view. Here you'll find:
              </p>
              <ul className="list-disc list-inside mt-4 text-left max-w-md mx-auto space-y-2 text-muted-foreground">
                <li>Day-by-day itinerary</li>
                <li>Recommended accommodations</li>
                <li>Must-visit attractions</li>
                <li>Local cuisine recommendations</li>
                <li>Transportation options</li>
                <li>Budget estimates</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}