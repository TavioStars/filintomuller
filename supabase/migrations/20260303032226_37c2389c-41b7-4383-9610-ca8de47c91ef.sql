
-- Add push_enabled column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_enabled boolean DEFAULT false;

-- Create in_app_notifications table
CREATE TABLE public.in_app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.in_app_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
ON public.in_app_notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- System/admins can insert notifications (via trigger or admin action)
CREATE POLICY "Admins can insert notifications"
ON public.in_app_notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow authenticated users to insert their own notifications (for system triggers)
CREATE POLICY "System can insert notifications for users"
ON public.in_app_notifications
FOR INSERT
WITH CHECK (true);

-- Enable realtime for in_app_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.in_app_notifications;

-- Create trigger function to broadcast in-app notifications when admin creates a notification
CREATE OR REPLACE FUNCTION public.notify_all_users_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
  preview_text TEXT;
BEGIN
  preview_text := LEFT(NEW.content, 100);
  
  FOR profile_record IN SELECT id FROM public.profiles WHERE status = 'approved'
  LOOP
    INSERT INTO public.in_app_notifications (user_id, type, title, body, data)
    VALUES (
      profile_record.id,
      'new_notification',
      NEW.title,
      preview_text,
      jsonb_build_object(
        'notification_id', NEW.id,
        'banner_image', NEW.banner_image
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger on notifications table
CREATE TRIGGER on_notification_created
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.notify_all_users_on_notification();
