-- Migração para Fase 2: M3 (Foto de Perfil) e M5 (Pastoralis Expandido)

-- M3: Storage & Foto
DO $$
BEGIN
    -- Add avatar_url to profiles if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Enable storage extension if missing (usually exists, but just in case for a clean setup)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insert storage bucket 'avatars'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket policies
CREATE POLICY "Avatar images are publicly accessible." 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload an avatar." 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can update their own avatar."
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');


-- M5: Pastoralis Expandido
CREATE TABLE IF NOT EXISTS pastoral_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    coordinator_id UUID REFERENCES people(id) ON DELETE SET NULL,
    vice_coordinator_id UUID REFERENCES people(id) ON DELETE SET NULL,
    treasurer_id UUID REFERENCES people(id) ON DELETE SET NULL,
    schedule TEXT, -- e.g., "Todos os sábados às 19h"
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS person_pastoral_groups (
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES pastoral_groups(id) ON DELETE CASCADE,
    role VARCHAR(100) DEFAULT 'Membro', -- 'Coordenador', 'Membro', etc
    joined_at DATE DEFAULT CURRENT_DATE,
    PRIMARY KEY(person_id, group_id)
);

-- RLS
ALTER TABLE pastoral_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_pastoral_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view and manage their pastoral groups" 
ON pastoral_groups FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE tenant_id = pastoral_groups.tenant_id)
);

CREATE POLICY "Tenants can manage their group members" 
ON person_pastoral_groups FOR ALL USING (
    auth.uid() IN (
        SELECT id FROM profiles 
        WHERE tenant_id = (SELECT tenant_id FROM pastoral_groups WHERE id = person_pastoral_groups.group_id)
    )
);
