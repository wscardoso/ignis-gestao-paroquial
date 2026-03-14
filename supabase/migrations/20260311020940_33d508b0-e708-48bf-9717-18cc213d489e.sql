
-- Staff/Clergy table for parish personnel management
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Outro',
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'off', 'inactive')),
  joined_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Tenant members can view staff in their tenant
CREATE POLICY "staff_select_tenant" ON public.staff
  FOR SELECT TO authenticated
  USING (get_my_tenant_id() = tenant_id);

-- Admins can do all operations on staff in their tenant
CREATE POLICY "staff_all_admins" ON public.staff
  FOR ALL TO authenticated
  USING (
    (get_my_role() = ANY (ARRAY['super_admin'::text, 'matriz_admin'::text]))
    AND ((get_my_tenant_id() = tenant_id) OR (get_my_role() = 'super_admin'::text))
  )
  WITH CHECK (
    (get_my_role() = ANY (ARRAY['super_admin'::text, 'matriz_admin'::text]))
    AND ((get_my_tenant_id() = tenant_id) OR (get_my_role() = 'super_admin'::text))
  );

-- Trigger for updated_at
CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
