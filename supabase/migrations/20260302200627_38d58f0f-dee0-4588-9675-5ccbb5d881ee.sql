
-- Drop the existing update policy
DROP POLICY IF EXISTS "Users can update their own profile except role" ON public.profiles;

-- Create a stricter policy that also prevents status and pending_approval changes
CREATE POLICY "Users can update their own profile except role and status"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
  AND status = (SELECT p.status FROM profiles p WHERE p.id = auth.uid())
  AND pending_approval IS NOT DISTINCT FROM (SELECT p.pending_approval FROM profiles p WHERE p.id = auth.uid())
);
