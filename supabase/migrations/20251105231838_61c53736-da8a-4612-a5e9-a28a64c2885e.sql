-- Fix PUBLIC_DATA_EXPOSURE issues by restricting access to authenticated users

-- 1. Update profiles table RLS policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Authenticated users can view profiles" 
ON profiles 
FOR SELECT 
TO authenticated
USING (true);

-- 2. Update bookings table RLS policy
DROP POLICY IF EXISTS "Anyone can view bookings" ON bookings;
CREATE POLICY "Authenticated users can view bookings" 
ON bookings 
FOR SELECT 
TO authenticated
USING (true);