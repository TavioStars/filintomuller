
-- Remove overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert notifications for users" ON public.in_app_notifications;

-- Allow authenticated users to insert notifications where they are admins (for booking deletion notifications)
CREATE POLICY "Authenticated can insert notifications for booking deletion"
ON public.in_app_notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
