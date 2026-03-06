CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '📽️',
  color text NOT NULL DEFAULT 'hsl(200, 70%, 50%)',
  status text NOT NULL DEFAULT 'disponivel',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_resource_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('disponivel', 'manutencao') THEN
    RAISE EXCEPTION 'status must be disponivel or manutencao';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_resource_status_trigger
  BEFORE INSERT OR UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.validate_resource_status();

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Admins can insert resources" ON public.resources FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update resources" ON public.resources FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete resources" ON public.resources FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.resources (name, emoji, color, status, display_order) VALUES
  ('Sala de Reunião', '🏢', 'hsl(280, 65%, 60%)', 'disponivel', 0),
  ('Datashow 1', '📽️', 'hsl(200, 70%, 50%)', 'disponivel', 1),
  ('Datashow 2', '📽️', 'hsl(30, 85%, 55%)', 'disponivel', 2),
  ('Datashow 3', '📽️', 'hsl(160, 60%, 45%)', 'disponivel', 3),
  ('STE 2', '🖥️', 'hsl(330, 70%, 60%)', 'disponivel', 4),
  ('Laboratório', '🔬', 'hsl(45, 85%, 60%)', 'disponivel', 5),
  ('Notebook', '💻', 'hsl(220, 60%, 55%)', 'disponivel', 6),
  ('Caixa de Som', '🔊', 'hsl(350, 65%, 55%)', 'disponivel', 7);