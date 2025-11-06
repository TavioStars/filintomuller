-- Create categories table for materials
CREATE TABLE public.material_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  display_order integer NOT NULL DEFAULT 0
);

-- Create materials table
CREATE TABLE public.materials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid NOT NULL REFERENCES public.material_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('video', 'link', 'file')),
  url text,
  file_path text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  display_order integer NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- RLS policies for material_categories
CREATE POLICY "Anyone can view categories" ON public.material_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can create categories" ON public.material_categories
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update categories" ON public.material_categories
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete categories" ON public.material_categories
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for materials
CREATE POLICY "Anyone can view materials" ON public.materials
  FOR SELECT USING (true);

CREATE POLICY "Admins can create materials" ON public.materials
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update materials" ON public.materials
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete materials" ON public.materials
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Update notifications table to have separate publication and event dates
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS event_date date;
ALTER TABLE public.notifications ALTER COLUMN date DROP NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN date SET DEFAULT now();

-- Rename 'date' to 'published_at' for clarity
ALTER TABLE public.notifications RENAME COLUMN date TO published_at;

-- Create storage bucket for material files
INSERT INTO storage.buckets (id, name, public)
VALUES ('material-files', 'material-files', true)
ON CONFLICT (id) DO NOTHING;