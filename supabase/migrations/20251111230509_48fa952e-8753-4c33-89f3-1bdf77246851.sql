-- Drop and recreate the handle_new_user function with correct status logic
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role TEXT;
  user_status access_status;
BEGIN
  -- Get the role from user metadata
  user_role := NEW.raw_user_meta_data->>'role';
  
  -- Set status based on role
  -- Students get approved automatically, all other roles need approval
  IF user_role = 'student' THEN
    user_status := 'approved';
  ELSE
    user_status := 'pending';
  END IF;
  
  -- Insert profile with correct status
  INSERT INTO public.profiles (id, name, role, status, pending_approval)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    user_role,
    user_status,
    CASE WHEN user_status = 'pending' THEN true ELSE false END
  );
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();