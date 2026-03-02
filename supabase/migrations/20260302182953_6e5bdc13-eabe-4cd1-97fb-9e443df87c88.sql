
-- Create schedules table
CREATE TABLE public.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period text NOT NULL,
  level text NOT NULL,
  file_url text NOT NULL,
  file_path text NOT NULL,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (period, level)
);

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_schedule_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.period NOT IN ('matutino', 'vespertino', 'noturno') THEN
    RAISE EXCEPTION 'period must be matutino, vespertino, or noturno';
  END IF;
  IF NEW.level NOT IN ('medio', 'fundamental') THEN
    RAISE EXCEPTION 'level must be medio or fundamental';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_schedule_fields_trigger
BEFORE INSERT OR UPDATE ON public.schedules
FOR EACH ROW EXECUTE FUNCTION public.validate_schedule_fields();

-- Enable RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view schedules" ON public.schedules
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert schedules" ON public.schedules
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete schedules" ON public.schedules
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update schedules" ON public.schedules
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('schedule-files', 'schedule-files', true);

CREATE POLICY "Anyone can view schedule files" ON storage.objects
  FOR SELECT USING (bucket_id = 'schedule-files');

CREATE POLICY "Admins can upload schedule files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'schedule-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete schedule files" ON storage.objects
  FOR DELETE USING (bucket_id = 'schedule-files' AND public.has_role(auth.uid(), 'admin'));
