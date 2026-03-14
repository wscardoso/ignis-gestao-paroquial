
-- Update handle_new_user to assign default tenant
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  default_tenant_id uuid;
BEGIN
  -- Get the first active tenant as default
  SELECT id INTO default_tenant_id FROM public.tenants WHERE status = 'active' LIMIT 1;
  
  INSERT INTO public.profiles (id, full_name, role, tenant_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'fiel',
    default_tenant_id
  );
  RETURN new;
END;
$$;
