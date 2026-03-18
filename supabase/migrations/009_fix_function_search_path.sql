-- Fix mutable search_path on update_updated_at_column function
-- Setting an explicit search_path prevents search path hijacking attacks

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
