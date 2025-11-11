-- Add status column to profiles using existing access_status enum
ALTER TABLE public.profiles
ADD COLUMN status access_status NOT NULL DEFAULT 'approved';

-- Update existing profiles: set to pending if pending_approval is true, otherwise approved
UPDATE public.profiles
SET status = CASE 
  WHEN pending_approval = true THEN 'pending'::access_status
  ELSE 'approved'::access_status
END;

-- Add 'denied' value to the existing access_status enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'denied' AND enumtypid = 'access_status'::regtype) THEN
    ALTER TYPE access_status ADD VALUE 'denied';
  END IF;
END $$;

-- Create function for admins to update account status
CREATE OR REPLACE FUNCTION public.update_account_status(target_user_id uuid, new_status access_status)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can update account status';
  END IF;
  
  -- Update the profile status
  UPDATE profiles
  SET status = new_status,
      pending_approval = CASE 
        WHEN new_status = 'pending' THEN true
        ELSE false
      END
  WHERE id = target_user_id;
END;
$$;