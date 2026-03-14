
-- =============================================
-- PHASE 0A: ATOMIC MIGRATION
-- 1. RLS Policies → PERMISSIVE
-- 2. Expand sacraments.type CHECK
-- 3. Re-enable auth trigger
-- =============================================

-- ============ 1. DROP ALL EXISTING POLICIES ============

-- tenants
DROP POLICY IF EXISTS "Tenants viewable by authenticated" ON tenants;
DROP POLICY IF EXISTS "Super admins manage tenants" ON tenants;
DROP POLICY IF EXISTS "Tenants are viewable by everyone" ON tenants;
DROP POLICY IF EXISTS "Super Admins can manage tenants" ON tenants;

-- sub_tenants
DROP POLICY IF EXISTS "Sub-tenants viewable by authenticated" ON sub_tenants;
DROP POLICY IF EXISTS "Admins manage sub-tenants" ON sub_tenants;

-- profiles
DROP POLICY IF EXISTS "Users view own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins view tenant profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins view tenant profiles" ON profiles;

-- appointments
DROP POLICY IF EXISTS "Tenant members view appointments" ON appointments;
DROP POLICY IF EXISTS "Tenant members insert appointments" ON appointments;
DROP POLICY IF EXISTS "Admins manage appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can manage tenant appointments" ON appointments;
DROP POLICY IF EXISTS "Comunidade leads and fiel can view appointments" ON appointments;
DROP POLICY IF EXISTS "Fiel can insert own appointments" ON appointments;

-- sacraments
DROP POLICY IF EXISTS "Tenant members view sacraments" ON sacraments;
DROP POLICY IF EXISTS "Admins manage sacraments" ON sacraments;
DROP POLICY IF EXISTS "Admins can manage tenant sacraments" ON sacraments;

-- people
DROP POLICY IF EXISTS "Tenant members view people" ON people;
DROP POLICY IF EXISTS "Admins manage people" ON people;

-- ============ 2. CREATE PERMISSIVE POLICIES ============

-- TENANTS
CREATE POLICY "tenants_select_authenticated" ON tenants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "tenants_all_super_admin" ON tenants
  FOR ALL TO authenticated USING (get_my_role() = 'super_admin')
  WITH CHECK (get_my_role() = 'super_admin');

-- SUB_TENANTS
CREATE POLICY "sub_tenants_select_authenticated" ON sub_tenants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "sub_tenants_all_admins" ON sub_tenants
  FOR ALL TO authenticated
  USING (
    get_my_role() IN ('super_admin', 'matriz_admin')
    AND (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin')
  )
  WITH CHECK (
    get_my_role() IN ('super_admin', 'matriz_admin')
    AND (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin')
  );

-- PROFILES
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_select_admins" ON profiles
  FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('super_admin', 'matriz_admin')
    AND (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin')
  );

-- APPOINTMENTS
CREATE POLICY "appointments_select_tenant" ON appointments
  FOR SELECT TO authenticated USING (get_my_tenant_id() = tenant_id);

CREATE POLICY "appointments_insert_tenant" ON appointments
  FOR INSERT TO authenticated WITH CHECK (get_my_tenant_id() = tenant_id);

CREATE POLICY "appointments_all_admins" ON appointments
  FOR ALL TO authenticated
  USING (
    get_my_role() IN ('super_admin', 'matriz_admin')
    AND (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin')
  )
  WITH CHECK (
    get_my_role() IN ('super_admin', 'matriz_admin')
    AND (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin')
  );

-- SACRAMENTS
CREATE POLICY "sacraments_select_tenant" ON sacraments
  FOR SELECT TO authenticated USING (get_my_tenant_id() = tenant_id);

CREATE POLICY "sacraments_insert_tenant" ON sacraments
  FOR INSERT TO authenticated WITH CHECK (get_my_tenant_id() = tenant_id);

CREATE POLICY "sacraments_all_admins" ON sacraments
  FOR ALL TO authenticated
  USING (
    get_my_role() IN ('super_admin', 'matriz_admin')
    AND (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin')
  )
  WITH CHECK (
    get_my_role() IN ('super_admin', 'matriz_admin')
    AND (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin')
  );

-- PEOPLE
CREATE POLICY "people_select_tenant" ON people
  FOR SELECT TO authenticated USING (get_my_tenant_id() = tenant_id);

CREATE POLICY "people_insert_tenant" ON people
  FOR INSERT TO authenticated WITH CHECK (get_my_tenant_id() = tenant_id);

CREATE POLICY "people_all_admins" ON people
  FOR ALL TO authenticated
  USING (
    get_my_role() IN ('super_admin', 'matriz_admin')
    AND (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin')
  )
  WITH CHECK (
    get_my_role() IN ('super_admin', 'matriz_admin')
    AND (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin')
  );

-- ============ 3. EXPAND SACRAMENTS CHECK ============
ALTER TABLE sacraments DROP CONSTRAINT IF EXISTS sacraments_type_check;
ALTER TABLE sacraments ADD CONSTRAINT sacraments_type_check
  CHECK (type IN ('baptism', 'marriage', 'confirmation', 'first_communion', 'anointing_of_sick'));

-- ============ 4. RE-ENABLE AUTH TRIGGER ============
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
