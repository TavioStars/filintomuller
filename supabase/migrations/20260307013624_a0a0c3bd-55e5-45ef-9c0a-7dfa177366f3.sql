CREATE OR REPLACE FUNCTION public.validate_resource_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('disponivel', 'manutencao', 'excluido') THEN
    RAISE EXCEPTION 'status must be disponivel, manutencao or excluido';
  END IF;
  RETURN NEW;
END;
$function$;