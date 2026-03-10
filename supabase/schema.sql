-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core Tenants (Paróquias)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sub-tenants (Comunidades/Capelas)
CREATE TABLE sub_tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  coordinates POINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (Linked to Auth Users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'fiel' CHECK (role IN ('super_admin', 'matriz_admin', 'comunidade_lead', 'fiel')),
  tenant_id UUID REFERENCES tenants(id),
  sub_tenant_id UUID REFERENCES sub_tenants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'fiel');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security (RLS)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Tenants:
-- Public read access for now (or simplified for MVP)
CREATE POLICY "Tenants are viewable by everyone" ON tenants
  FOR SELECT USING (true);

-- Only Super Admins can insert/update tenants
CREATE POLICY "Super Admins can manage tenants" ON tenants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );

-- Profiles:
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view profiles in their tenant
CREATE POLICY "Admins view tenant profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles as admin
      WHERE admin.id = auth.uid() 
      AND (admin.tenant_id = profiles.tenant_id OR admin.role = 'super_admin')
      AND admin.role IN ('super_admin', 'matriz_admin')
    )
  );

-- Appointments (Agendamentos)
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  sub_tenant_id UUID REFERENCES sub_tenants(id) ON DELETE CASCADE,
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
  parent_appointment_id UUID REFERENCES appointments(id),
  whatsapp_status TEXT DEFAULT 'none' CHECK (whatsapp_status IN ('none', 'pending', 'sent', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sacraments (Vida Sacramental)
CREATE TABLE sacraments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('baptism', 'marriage', 'confirmation')),
  celebrant_id UUID,
  subject_id UUID,
  celebratory_date DATE NOT NULL,
  book_number TEXT,
  page_number TEXT,
  entry_number TEXT,
  subject_name TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for new tables
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sacraments ENABLE ROW LEVEL SECURITY;

-- Policies for Appointments
CREATE POLICY "Admins can manage tenant appointments" ON appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND (profiles.tenant_id = appointments.tenant_id OR profiles.role = 'super_admin')
      AND profiles.role IN ('super_admin', 'matriz_admin')
    )
  );

-- Comunidade Leads and Fiel can view appointments in their tenant
CREATE POLICY "Comunidade leads and fiel can view appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = appointments.tenant_id
    )
  );

-- Fiel can insert own appointments (they are default to pending and linked to the tenant)
CREATE POLICY "Fiel can insert own appointments" ON appointments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = appointments.tenant_id
    )
  );

-- Policies for Sacraments
CREATE POLICY "Admins can manage tenant sacraments" ON sacraments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND (profiles.tenant_id = sacraments.tenant_id OR profiles.role = 'super_admin')
      AND profiles.role IN ('super_admin', 'matriz_admin')
    )
  );
