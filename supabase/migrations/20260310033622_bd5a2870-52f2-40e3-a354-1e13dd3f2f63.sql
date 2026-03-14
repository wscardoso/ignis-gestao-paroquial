
-- ═══════════════════════════════════════
-- STEP 1: Create ALL tables first
-- ═══════════════════════════════════════

CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  address TEXT,
  neighborhood TEXT,
  city TEXT,
  state CHAR(2),
  zip_code TEXT,
  phone TEXT,
  priest_name TEXT,
  slogan TEXT,
  logo_url TEXT,
  active_modules TEXT[] DEFAULT ARRAY['missio','sacramenta','pastoralis'],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.sub_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'fiel' CHECK (role IN ('super_admin', 'matriz_admin', 'comunidade_lead', 'fiel')),
  tenant_id UUID REFERENCES public.tenants(id),
  sub_tenant_id UUID REFERENCES public.sub_tenants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.appointments (
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

CREATE TABLE public.people (
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

CREATE TABLE public.sacraments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('baptism', 'marriage', 'confirmation')),
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

-- ═══════════════════════════════════════
-- STEP 2: Enable RLS on all tables
-- ═══════════════════════════════════════
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sacraments ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════
-- STEP 3: RLS Policies (profiles exists now)
-- ═══════════════════════════════════════

-- Tenants
CREATE POLICY "Tenants viewable by authenticated" ON public.tenants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins manage tenants" ON public.tenants
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  );

-- Sub-tenants
CREATE POLICY "Sub-tenants viewable by authenticated" ON public.sub_tenants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage sub-tenants" ON public.sub_tenants
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.tenant_id = sub_tenants.tenant_id OR profiles.role = 'super_admin')
      AND profiles.role IN ('super_admin', 'matriz_admin')
    )
  );

-- Profiles
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins view tenant profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS admin
      WHERE admin.id = auth.uid()
      AND admin.role IN ('super_admin', 'matriz_admin')
      AND (admin.tenant_id = profiles.tenant_id OR admin.role = 'super_admin')
    )
  );

-- Appointments
CREATE POLICY "Admins manage appointments" ON public.appointments
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.tenant_id = appointments.tenant_id OR profiles.role = 'super_admin')
      AND profiles.role IN ('super_admin', 'matriz_admin')
    )
  );

CREATE POLICY "Tenant members view appointments" ON public.appointments
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.tenant_id = appointments.tenant_id)
  );

CREATE POLICY "Tenant members insert appointments" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.tenant_id = appointments.tenant_id)
  );

-- Sacraments
CREATE POLICY "Admins manage sacraments" ON public.sacraments
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.tenant_id = sacraments.tenant_id OR profiles.role = 'super_admin')
      AND profiles.role IN ('super_admin', 'matriz_admin')
    )
  );

CREATE POLICY "Tenant members view sacraments" ON public.sacraments
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.tenant_id = sacraments.tenant_id)
  );

-- People
CREATE POLICY "Admins manage people" ON public.people
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.tenant_id = people.tenant_id OR profiles.role = 'super_admin')
      AND profiles.role IN ('super_admin', 'matriz_admin')
    )
  );

CREATE POLICY "Tenant members view people" ON public.people
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.tenant_id = people.tenant_id)
  );

-- ═══════════════════════════════════════
-- STEP 4: Auto-create profile on signup
-- ═══════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'fiel');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════
-- STEP 5: Updated_at trigger
-- ═══════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON public.people
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════
-- STEP 6: Indexes
-- ═══════════════════════════════════════
CREATE INDEX idx_appointments_tenant ON public.appointments(tenant_id);
CREATE INDEX idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX idx_sacraments_tenant ON public.sacraments(tenant_id);
CREATE INDEX idx_sacraments_type ON public.sacraments(type);
CREATE INDEX idx_sacraments_subject_name ON public.sacraments(subject_name);
CREATE INDEX idx_people_tenant ON public.people(tenant_id);
CREATE INDEX idx_people_name ON public.people(name);
CREATE INDEX idx_sub_tenants_tenant ON public.sub_tenants(tenant_id);
