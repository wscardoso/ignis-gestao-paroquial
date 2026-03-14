
-- Create a security definer function to check user role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Drop and recreate all policies that reference profiles from other tables

-- TENANTS
DROP POLICY IF EXISTS "Super admins manage tenants" ON public.tenants;
CREATE POLICY "Super admins manage tenants" ON public.tenants
  FOR ALL TO authenticated
  USING (public.get_my_role() = 'super_admin');

-- SUB_TENANTS
DROP POLICY IF EXISTS "Admins manage sub-tenants" ON public.sub_tenants;
CREATE POLICY "Admins manage sub-tenants" ON public.sub_tenants
  FOR ALL TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'matriz_admin') AND (public.get_my_tenant_id() = sub_tenants.tenant_id OR public.get_my_role() = 'super_admin'));

-- APPOINTMENTS
DROP POLICY IF EXISTS "Tenant members view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Tenant members insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins manage appointments" ON public.appointments;

CREATE POLICY "Tenant members view appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (public.get_my_tenant_id() = appointments.tenant_id);

CREATE POLICY "Tenant members insert appointments" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (public.get_my_tenant_id() = appointments.tenant_id);

CREATE POLICY "Admins manage appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'matriz_admin') AND (public.get_my_tenant_id() = appointments.tenant_id OR public.get_my_role() = 'super_admin'));

-- SACRAMENTS
DROP POLICY IF EXISTS "Tenant members view sacraments" ON public.sacraments;
DROP POLICY IF EXISTS "Admins manage sacraments" ON public.sacraments;

CREATE POLICY "Tenant members view sacraments" ON public.sacraments
  FOR SELECT TO authenticated
  USING (public.get_my_tenant_id() = sacraments.tenant_id);

CREATE POLICY "Admins manage sacraments" ON public.sacraments
  FOR ALL TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'matriz_admin') AND (public.get_my_tenant_id() = sacraments.tenant_id OR public.get_my_role() = 'super_admin'));

-- PEOPLE
DROP POLICY IF EXISTS "Tenant members view people" ON public.people;
DROP POLICY IF EXISTS "Admins manage people" ON public.people;

CREATE POLICY "Tenant members view people" ON public.people
  FOR SELECT TO authenticated
  USING (public.get_my_tenant_id() = people.tenant_id);

CREATE POLICY "Admins manage people" ON public.people
  FOR ALL TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'matriz_admin') AND (public.get_my_tenant_id() = people.tenant_id OR public.get_my_role() = 'super_admin'));

-- PROFILES - fix recursive policy
DROP POLICY IF EXISTS "Admins view tenant profiles" ON public.profiles;
CREATE POLICY "Admins view tenant profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'matriz_admin') AND (public.get_my_tenant_id() = profiles.tenant_id OR public.get_my_role() = 'super_admin'));
