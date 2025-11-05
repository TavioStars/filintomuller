-- Add foreign key constraint to link bookings to profiles
ALTER TABLE bookings 
ADD CONSTRAINT bookings_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;