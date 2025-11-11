-- Fix 1: Make profiles.role read-only by preventing users from changing it
-- Drop the existing update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new policy that allows updates but prevents role changes
CREATE POLICY "Users can update their own profile except role"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  role = (SELECT role FROM profiles WHERE id = auth.uid())
);

-- Fix 2: Create a public view for notifications without admin IDs
CREATE OR REPLACE VIEW public.notifications_public AS
SELECT 
  id,
  title,
  content,
  event_date,
  banner_image,
  additional_images,
  links,
  published_at,
  created_at
FROM public.notifications;

-- Grant access to the view
GRANT SELECT ON public.notifications_public TO authenticated, anon;

-- Enable RLS on the view (views inherit policies but this makes it explicit)
ALTER VIEW public.notifications_public SET (security_invoker = true);