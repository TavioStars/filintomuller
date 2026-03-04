
-- When a notification is deleted, cascade delete all related in_app_notifications
CREATE OR REPLACE FUNCTION public.cascade_delete_in_app_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.in_app_notifications
  WHERE type = 'new_notification'
    AND data->>'notification_id' = OLD.id::text;
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_notification_delete
  AFTER DELETE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.cascade_delete_in_app_notifications();
