-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATE NOT NULL,
  banner_image TEXT,
  additional_images TEXT[],
  links TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Anyone can view notifications"
ON public.notifications
FOR SELECT
USING (true);

CREATE POLICY "Admins can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update notifications"
ON public.notifications
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete notifications"
ON public.notifications
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update bookings RLS to allow admins to delete any booking
DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.bookings;

CREATE POLICY "Users can delete their own bookings or admins can delete any"
ON public.bookings
FOR DELETE
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for notification images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('notification-images', 'notification-images', true);

-- Storage policies for notification images
CREATE POLICY "Anyone can view notification images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'notification-images');

CREATE POLICY "Admins can upload notification images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'notification-images' AND public.has_role(auth.uid(), 'admin'));

-- Add the specific user as admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('b2f51d09-b4cd-4a9c-8b23-592237f8a6e2', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;