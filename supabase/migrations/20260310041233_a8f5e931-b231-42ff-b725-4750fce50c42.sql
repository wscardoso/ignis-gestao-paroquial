
-- Fix ALL policies to be PERMISSIVE (they are currently all RESTRICTIVE)

-- TENANTS
DROP POLICY IF EXISTS "Tenants viewable by authenticated" ON public.tenants;
DROP POLICY IF EXISTS "Super admins manage tenants" ON public.tenants;
CREATE POLICY "Tenants viewable by authenticated" ON public.tenants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins manage tenants" ON public.tenants FOR ALL TO authenticated USING (public.get_my_role() = 'super_admin');

-- SUB_TENANTS
DROP POLICY IF EXISTS "Sub-tenants viewable by authenticated" ON public.sub_tenants;
DROP POLICY IF EXISTS "Admins manage sub-tenants" ON public.sub_tenants;
CREATE POLICY "Sub-tenants viewable by authenticated" ON public.sub_tenants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage sub-tenants" ON public.sub_tenants FOR ALL TO authenticated USING (public.get_my_role() IN ('super_admin', 'matriz_admin') AND (public.get_my_tenant_id() = tenant_id OR public.get_my_role() = 'super_admin'));

-- PROFILES
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins view tenant profiles" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Allow insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins view tenant profiles" ON public.profiles FOR SELECT TO authenticated USING (public.get_my_role() IN ('super_admin', 'matriz_admin') AND (public.get_my_tenant_id() = tenant_id OR public.get_my_role() = 'super_admin'));

-- APPOINTMENTS
DROP POLICY IF EXISTS "Tenant members view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Tenant members insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins manage appointments" ON public.appointments;
CREATE POLICY "Tenant members view appointments" ON public.appointments FOR SELECT TO authenticated USING (public.get_my_tenant_id() = tenant_id);
CREATE POLICY "Tenant members insert appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (public.get_my_tenant_id() = tenant_id);
CREATE POLICY "Admins manage appointments" ON public.appointments FOR ALL TO authenticated USING (public.get_my_role() IN ('super_admin', 'matriz_admin') AND (public.get_my_tenant_id() = tenant_id OR public.get_my_role() = 'super_admin'));

-- SACRAMENTS
DROP POLICY IF EXISTS "Tenant members view sacraments" ON public.sacraments;
DROP POLICY IF EXISTS "Admins manage sacraments" ON public.sacraments;
CREATE POLICY "Tenant members view sacraments" ON public.sacraments FOR SELECT TO authenticated USING (public.get_my_tenant_id() = tenant_id);
CREATE POLICY "Admins manage sacraments" ON public.sacraments FOR ALL TO authenticated USING (public.get_my_role() IN ('super_admin', 'matriz_admin') AND (public.get_my_tenant_id() = tenant_id OR public.get_my_role() = 'super_admin'));

-- PEOPLE
DROP POLICY IF EXISTS "Tenant members view people" ON public.people;
DROP POLICY IF EXISTS "Admins manage people" ON public.people;
CREATE POLICY "Tenant members view people" ON public.people FOR SELECT TO authenticated USING (public.get_my_tenant_id() = tenant_id);
CREATE POLICY "Admins manage people" ON public.people FOR ALL TO authenticated USING (public.get_my_role() IN ('super_admin', 'matriz_admin') AND (public.get_my_tenant_id() = tenant_id OR public.get_my_role() = 'super_admin'));

-- Also recreate the trigger that was dropped
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
