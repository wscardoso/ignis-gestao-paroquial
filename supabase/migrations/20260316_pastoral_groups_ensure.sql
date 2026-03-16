-- Garante criação da tabela pastoral_groups e person_pastoral_groups
-- Idempotente: usa IF NOT EXISTS em tudo

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS pastoral_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    coordinator_id UUID REFERENCES people(id) ON DELETE SET NULL,
    vice_coordinator_id UUID REFERENCES people(id) ON DELETE SET NULL,
    treasurer_id UUID REFERENCES people(id) ON DELETE SET NULL,
    schedule TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS person_pastoral_groups (
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES pastoral_groups(id) ON DELETE CASCADE,
    role VARCHAR(100) DEFAULT 'Membro',
    joined_at DATE DEFAULT CURRENT_DATE,
    PRIMARY KEY(person_id, group_id)
);

ALTER TABLE pastoral_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_pastoral_groups ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'pastoral_groups'
        AND policyname = 'Tenants can view and manage their pastoral groups'
    ) THEN
        CREATE POLICY "Tenants can view and manage their pastoral groups"
        ON pastoral_groups FOR ALL USING (
            auth.uid() IN (SELECT id FROM profiles WHERE tenant_id = pastoral_groups.tenant_id)
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'person_pastoral_groups'
        AND policyname = 'Tenants can manage their group members'
    ) THEN
        CREATE POLICY "Tenants can manage their group members"
        ON person_pastoral_groups FOR ALL USING (
            auth.uid() IN (
                SELECT id FROM profiles
                WHERE tenant_id = (SELECT tenant_id FROM pastoral_groups WHERE id = person_pastoral_groups.group_id)
            )
        );
    END IF;
END $$;
