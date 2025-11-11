-- Add unique constraint to prevent duplicate bookings
ALTER TABLE bookings 
ADD CONSTRAINT unique_booking 
UNIQUE (date, class_name, resource, period);

-- Create enum for access request status
CREATE TYPE access_status AS ENUM ('pending', 'approved', 'denied');

-- Create access_requests table
CREATE TABLE access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  requested_role TEXT NOT NULL,
  status access_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for access_requests
CREATE POLICY "Admins can view all access requests"
ON access_requests FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update access requests"
ON access_requests FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own access request"
ON access_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own access request"
ON access_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Indices for better performance
CREATE INDEX idx_access_requests_status ON access_requests(status);
CREATE INDEX idx_access_requests_user_id ON access_requests(user_id);

-- Add pending_approval column to profiles
ALTER TABLE profiles 
ADD COLUMN pending_approval BOOLEAN DEFAULT FALSE;

-- Function to add admin role
CREATE OR REPLACE FUNCTION add_admin_role(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário que está chamando é admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can add admin roles';
  END IF;
  
  -- Inserir role se não existir
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT DO NOTHING;
END;
$$;

-- Function to remove admin role
CREATE OR REPLACE FUNCTION remove_admin_role(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário que está chamando é admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can remove admin roles';
  END IF;
  
  -- Remover role
  DELETE FROM user_roles 
  WHERE user_id = target_user_id AND role = 'admin';
END;
$$;

-- Enable realtime for access_requests
ALTER PUBLICATION supabase_realtime ADD TABLE access_requests;