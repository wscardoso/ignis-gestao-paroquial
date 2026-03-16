-- ================================================================
-- IGNIS - Schema Completo
-- Execute este script UMA VEZ no SQL Editor do Supabase
-- ================================================================

-- ================================================================
-- 1. EXTENSÕES
-- ================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 2. TABELAS PRINCIPAIS
-- ================================================================

CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  address TEXT,
  number TEXT,
  neighborhood TEXT,
  city TEXT,
  state CHAR(2),
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  priest_name TEXT,
  slogan TEXT,
  logo_url TEXT,
  foundation_date TEXT,
  notes TEXT,
  active_modules TEXT[] DEFAULT ARRAY['missio','sacramenta','pastoralis'],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sub_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'fiel' CHECK (role IN ('super_admin', 'matriz_admin', 'comunidade_lead', 'padre', 'fiel')),
  tenant_id UUID REFERENCES public.tenants(id),
  sub_tenant_id UUID REFERENCES public.sub_tenants(id),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  sub_tenant_id UUID REFERENCES public.sub_tenants(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  service_type TEXT NOT NULL,
  celebrant_name TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'remarcado')),
  notes TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  parent_appointment_id UUID REFERENCES public.appointments(id),
  whatsapp_status TEXT DEFAULT 'none' CHECK (whatsapp_status IN ('none', 'pending', 'sent', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  cpf TEXT,
  birth_date DATE,
  email TEXT,
  phone TEXT,
  address TEXT,
  photo_url TEXT,
  sacraments_data JSONB DEFAULT '{}'::jsonb,
  groups TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deceased')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sacraments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('baptism', 'marriage', 'confirmation', 'first_communion', 'anointing_of_sick')),
  celebrant_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  celebratory_date DATE NOT NULL,
  book_number TEXT,
  page_number TEXT,
  entry_number TEXT,
  subject_name TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staff (
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

CREATE TABLE IF NOT EXISTS public.pastoral_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  coordinator_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  vice_coordinator_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  treasurer_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  schedule TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.person_pastoral_groups (
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.pastoral_groups(id) ON DELETE CASCADE,
  role VARCHAR(100) DEFAULT 'Membro',
  joined_at DATE DEFAULT CURRENT_DATE,
  PRIMARY KEY(person_id, group_id)
);

CREATE TABLE IF NOT EXISTS public.financial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sub_tenant_id UUID REFERENCES public.sub_tenants(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.financial_categories(id) ON DELETE RESTRICT,
  person_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  transaction_date DATE NOT NULL,
  payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'pix', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other')),
  status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sub_tenant_id UUID REFERENCES public.sub_tenants(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL CHECK (category IN ('real_estate', 'vehicle', 'equipment', 'liturgical', 'furniture', 'other')),
  purchase_date DATE,
  estimated_value DECIMAL(12,2),
  condition VARCHAR(50) CHECK (condition IN ('new', 'good', 'fair', 'poor', 'broken')),
  location TEXT,
  photo_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'sold', 'discarded')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL CHECK (category IN ('contract', 'minutes', 'decree', 'certificate', 'other')),
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size_bytes BIGINT,
  issue_date DATE,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- 3. FUNÇÕES UTILITÁRIAS (SECURITY DEFINER — sem recursão no RLS)
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  default_tenant_id uuid;
BEGIN
  SELECT id INTO default_tenant_id FROM public.tenants WHERE status = 'active' LIMIT 1;
  INSERT INTO public.profiles (id, full_name, role, tenant_id)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', ''), 'fiel', default_tenant_id);
  RETURN new;
END;
$$;

-- ================================================================
-- 4. TRIGGERS
-- ================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_people_updated_at ON public.people;
CREATE TRIGGER update_people_updated_at
  BEFORE UPDATE ON public.people
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_updated_at ON public.staff;
CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================================
-- 5. ÍNDICES
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_appointments_tenant ON public.appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_sacraments_tenant ON public.sacraments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sacraments_type ON public.sacraments(type);
CREATE INDEX IF NOT EXISTS idx_sacraments_subject_name ON public.sacraments(subject_name);
CREATE INDEX IF NOT EXISTS idx_people_tenant ON public.people(tenant_id);
CREATE INDEX IF NOT EXISTS idx_people_name ON public.people(name);
CREATE INDEX IF NOT EXISTS idx_sub_tenants_tenant ON public.sub_tenants(tenant_id);

-- ================================================================
-- 6. ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sacraments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pastoral_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_pastoral_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 7. POLÍTICAS RLS
-- ================================================================

-- TENANTS
DROP POLICY IF EXISTS "tenants_select_authenticated" ON public.tenants;
DROP POLICY IF EXISTS "tenants_all_super_admin" ON public.tenants;
CREATE POLICY "tenants_select_authenticated" ON public.tenants FOR SELECT TO authenticated USING (true);
CREATE POLICY "tenants_all_super_admin" ON public.tenants FOR ALL TO authenticated
  USING (get_my_role() = 'super_admin') WITH CHECK (get_my_role() = 'super_admin');

-- SUB_TENANTS
DROP POLICY IF EXISTS "sub_tenants_select_authenticated" ON public.sub_tenants;
DROP POLICY IF EXISTS "sub_tenants_all_admins" ON public.sub_tenants;
CREATE POLICY "sub_tenants_select_authenticated" ON public.sub_tenants FOR SELECT TO authenticated USING (true);
CREATE POLICY "sub_tenants_all_admins" ON public.sub_tenants FOR ALL TO authenticated
  USING (get_my_role() IN ('super_admin', 'matriz_admin') AND (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin'))
  WITH CHECK (get_my_role() IN ('super_admin', 'matriz_admin') AND (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin'));

-- PROFILES
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admins" ON public.profiles;
DROP POLICY IF EXISTS "super_admin_view_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "super_admin_update_profiles" ON public.profiles;
DROP POLICY IF EXISTS "super_admin_delete_profiles" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_select_admins" ON public.profiles FOR SELECT TO authenticated
  USING (get_my_role() IN ('super_admin', 'matriz_admin') AND (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin'));
CREATE POLICY "super_admin_update_profiles" ON public.profiles FOR UPDATE TO authenticated USING (get_my_role() = 'super_admin');
CREATE POLICY "super_admin_delete_profiles" ON public.profiles FOR DELETE TO authenticated USING (get_my_role() = 'super_admin');

-- APPOINTMENTS
DROP POLICY IF EXISTS "appointments_select_tenant" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_tenant" ON public.appointments;
DROP POLICY IF EXISTS "appointments_all_admins" ON public.appointments;
CREATE POLICY "appointments_select_tenant" ON public.appointments FOR SELECT TO authenticated USING (get_my_tenant_id() = tenant_id);
CREATE POLICY "appointments_insert_tenant" ON public.appointments FOR INSERT TO authenticated WITH CHECK (get_my_tenant_id() = tenant_id);
CREATE POLICY "appointments_all_admins" ON public.appointments FOR ALL TO authenticated
  USING (get_my_role() IN ('super_admin', 'matriz_admin') AND (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin'))
  WITH CHECK (get_my_role() IN ('super_admin', 'matriz_admin') AND (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin'));

-- SACRAMENTS
DROP POLICY IF EXISTS "sacraments_select_tenant" ON public.sacraments;
DROP POLICY IF EXISTS "sacraments_insert_tenant" ON public.sacraments;
DROP POLICY IF EXISTS "sacraments_all_admins" ON public.sacraments;
CREATE POLICY "sacraments_select_tenant" ON public.sacraments FOR SELECT TO authenticated USING (get_my_tenant_id() = tenant_id);
CREATE POLICY "sacraments_insert_tenant" ON public.sacraments FOR INSERT TO authenticated WITH CHECK (get_my_tenant_id() = tenant_id);
CREATE POLICY "sacraments_all_admins" ON public.sacraments FOR ALL TO authenticated
  USING (get_my_role() IN ('super_admin', 'matriz_admin') AND (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin'))
  WITH CHECK (get_my_role() IN ('super_admin', 'matriz_admin') AND (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin'));

-- PEOPLE
DROP POLICY IF EXISTS "people_select_tenant" ON public.people;
DROP POLICY IF EXISTS "people_insert_tenant" ON public.people;
DROP POLICY IF EXISTS "people_all_admins" ON public.people;
CREATE POLICY "people_select_tenant" ON public.people FOR SELECT TO authenticated USING (get_my_tenant_id() = tenant_id);
CREATE POLICY "people_insert_tenant" ON public.people FOR INSERT TO authenticated WITH CHECK (get_my_tenant_id() = tenant_id);
CREATE POLICY "people_all_admins" ON public.people FOR ALL TO authenticated
  USING (get_my_role() IN ('super_admin', 'matriz_admin') AND (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin'))
  WITH CHECK (get_my_role() IN ('super_admin', 'matriz_admin') AND (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin'));

-- STAFF
DROP POLICY IF EXISTS "staff_select_tenant" ON public.staff;
DROP POLICY IF EXISTS "staff_all_admins" ON public.staff;
CREATE POLICY "staff_select_tenant" ON public.staff FOR SELECT TO authenticated USING (get_my_tenant_id() = tenant_id);
CREATE POLICY "staff_all_admins" ON public.staff FOR ALL TO authenticated
  USING (get_my_role() IN ('super_admin', 'matriz_admin') AND (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin'))
  WITH CHECK (get_my_role() IN ('super_admin', 'matriz_admin') AND (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin'));

-- PASTORAL GROUPS
DROP POLICY IF EXISTS "pastoral_groups_all_tenant" ON public.pastoral_groups;
DROP POLICY IF EXISTS "person_pastoral_groups_all_tenant" ON public.person_pastoral_groups;
CREATE POLICY "pastoral_groups_all_tenant" ON public.pastoral_groups FOR ALL TO authenticated
  USING (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin')
  WITH CHECK (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin');
CREATE POLICY "person_pastoral_groups_all_tenant" ON public.person_pastoral_groups FOR ALL TO authenticated
  USING (get_my_role() IN ('super_admin', 'matriz_admin') OR get_my_tenant_id() = (SELECT tenant_id FROM public.pastoral_groups WHERE id = group_id));

-- FINANCIAL
DROP POLICY IF EXISTS "financial_categories_all_tenant" ON public.financial_categories;
DROP POLICY IF EXISTS "financial_transactions_all_tenant" ON public.financial_transactions;
DROP POLICY IF EXISTS "assets_all_tenant" ON public.assets;
DROP POLICY IF EXISTS "documents_all_tenant" ON public.documents;
CREATE POLICY "financial_categories_all_tenant" ON public.financial_categories FOR ALL TO authenticated
  USING (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin');
CREATE POLICY "financial_transactions_all_tenant" ON public.financial_transactions FOR ALL TO authenticated
  USING (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin');
CREATE POLICY "assets_all_tenant" ON public.assets FOR ALL TO authenticated
  USING (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin');
CREATE POLICY "documents_all_tenant" ON public.documents FOR ALL TO authenticated
  USING (get_my_tenant_id() = tenant_id OR get_my_role() = 'super_admin');

-- ================================================================
-- 8. REALTIME
-- ================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

-- ================================================================
-- 9. STORAGE BUCKETS
-- ================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('parishes', 'parishes', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
DROP POLICY IF EXISTS "parishes_insert" ON storage.objects;
DROP POLICY IF EXISTS "parishes_select" ON storage.objects;
DROP POLICY IF EXISTS "parishes_update" ON storage.objects;

CREATE POLICY "avatars_public_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "parishes_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'parishes');
CREATE POLICY "parishes_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'parishes');
CREATE POLICY "parishes_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'parishes');
