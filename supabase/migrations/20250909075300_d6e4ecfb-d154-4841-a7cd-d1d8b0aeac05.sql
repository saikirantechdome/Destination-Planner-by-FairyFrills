-- First, let's add the missing foreign key constraint for trip_requests
-- The trip_requests table should reference the profiles table, not auth.users directly
ALTER TABLE public.trip_requests 
DROP CONSTRAINT IF EXISTS trip_requests_user_id_fkey;

ALTER TABLE public.trip_requests 
ADD CONSTRAINT trip_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Create trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, phone_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'phone_number'
  );
  RETURN NEW;
END;
$$;

-- Create trigger that fires when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();