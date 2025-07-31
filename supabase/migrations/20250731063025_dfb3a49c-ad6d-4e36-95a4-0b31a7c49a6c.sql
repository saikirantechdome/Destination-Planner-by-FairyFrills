-- Create trip_requests table for destination planner
CREATE TABLE public.trip_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  place_name TEXT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trip_requests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read and create trip requests (public app)
CREATE POLICY "Anyone can view trip requests" 
ON public.trip_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create trip requests" 
ON public.trip_requests 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_trip_requests_status ON public.trip_requests(status);
CREATE INDEX idx_trip_requests_created_at ON public.trip_requests(created_at);