
-- Fix: Drop restrictive policies and recreate as PERMISSIVE

-- TENANTS
DROP POLICY IF EXISTS "Tenants viewable by authenticated" ON public.tenants;
DROP POLICY IF EXISTS "Super admins manage tenants" ON public.tenants;

CREATE POLICY "Tenants viewable by authenticated" ON public.tenants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins manage tenants" ON public.tenants
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'));

-- SUB_TENANTS
DROP POLICY IF EXISTS "Sub-tenants viewable by authenticated" ON public.sub_tenants;
DROP POLICY IF EXISTS "Admins manage sub-tenants" ON public.sub_tenants;

CREATE POLICY "Sub-tenants viewable by authenticated" ON public.sub_tenants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage sub-tenants" ON public.sub_tenants
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.tenant_id = sub_tenants.tenant_id OR profiles.role = 'super_admin') AND profiles.role IN ('super_admin', 'matriz_admin')));

-- PROFILES
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins view tenant profiles" ON public.profiles;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins view tenant profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles admin WHERE admin.id = auth.uid() AND admin.role IN ('super_admin', 'matriz_admin') AND (admin.tenant_id = profiles.tenant_id OR admin.role = 'super_admin')));

-- APPOINTMENTS
DROP POLICY IF EXISTS "Tenant members view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Tenant members insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins manage appointments" ON public.appointments;

CREATE POLICY "Tenant members view appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.tenant_id = appointments.tenant_id));

CREATE POLICY "Tenant members insert appointments" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.tenant_id = appointments.tenant_id));

CREATE POLICY "Admins manage appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.tenant_id = appointments.tenant_id OR profiles.role = 'super_admin') AND profiles.role IN ('super_admin', 'matriz_admin')));

-- SACRAMENTS
DROP POLICY IF EXISTS "Tenant members view sacraments" ON public.sacraments;
DROP POLICY IF EXISTS "Admins manage sacraments" ON public.sacraments;

CREATE POLICY "Tenant members view sacraments" ON public.sacraments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.tenant_id = sacraments.tenant_id));

CREATE POLICY "Admins manage sacraments" ON public.sacraments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.tenant_id = sacraments.tenant_id OR profiles.role = 'super_admin') AND profiles.role IN ('super_admin', 'matriz_admin')));

-- PEOPLE
DROP POLICY IF EXISTS "Tenant members view people" ON public.people;
DROP POLICY IF EXISTS "Admins manage people" ON public.people;

CREATE POLICY "Tenant members view people" ON public.people
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.tenant_id = people.tenant_id));

CREATE POLICY "Admins manage people" ON public.people
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.tenant_id = people.tenant_id OR profiles.role = 'super_admin') AND profiles.role IN ('super_admin', 'matriz_admin')));
