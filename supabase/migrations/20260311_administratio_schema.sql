-- Módulo: IGNIS Administratio
-- Finalidade: Gestão Financeira, Patrimonial e Documental da Paróquia

-- 1. Tabela de Categorias Financeiras (Plano de Contas Simplificado)
CREATE TABLE IF NOT EXISTS financial_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir categorias padrão para novos tenants (opcional, pode ser feito via Edge Function ou aplicação)

-- 2. Tabela Unificada de Transações Financeiras (Livro Caixa)
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sub_tenant_id UUID REFERENCES sub_tenants(id) ON DELETE SET NULL, -- Se a transação for de uma capela específica
    category_id UUID REFERENCES financial_categories(id) ON DELETE RESTRICT,
    person_id UUID REFERENCES people(id) ON DELETE SET NULL, -- Se foi dízimo de alguém específico
    
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    
    transaction_date DATE NOT NULL,
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'pix', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other')),
    status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    
    receipt_url TEXT, -- Arquivo no Storage (recibo escaneado)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Gestão de Patrimônio (Assets)
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sub_tenant_id UUID REFERENCES sub_tenants(id) ON DELETE SET NULL,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL CHECK (category IN ('real_estate', 'vehicle', 'equipment', 'liturgical', 'furniture', 'other')),
    
    purchase_date DATE,
    estimated_value DECIMAL(12,2),
    condition VARCHAR(50) CHECK (condition IN ('new', 'good', 'fair', 'poor', 'broken')),
    location TEXT,
    
    photo_url TEXT,
    
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'sold', 'discarded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Documentos (Repositório)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL CHECK (category IN ('contract', 'minutes', 'decree', 'certificate', 'other')),
    
    file_url TEXT NOT NULL,
    file_type VARCHAR(50), -- pdf, docs, etc.
    file_size_bytes BIGINT,
    
    issue_date DATE,
    expiry_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) Policies
-- Ativando RLS para todas as tabelas
ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Exemplo de Policies (Simplificadas para o protótipo: admins tem acesso aos dados do seu tenant)
-- Nota: Adaptar conforme a estrutura de roles do seu App (ex: apenas usuarios com role 'financial_admin' ou 'super_admin' gerem financeiro)
CREATE POLICY "Tenants can manage their own financial_categories" 
    ON financial_categories FOR ALL USING (auth.uid() IN (
        SELECT id FROM profiles WHERE tenant_id = financial_categories.tenant_id
    ));

CREATE POLICY "Tenants can manage their own financial_transactions" 
    ON financial_transactions FOR ALL USING (auth.uid() IN (
        SELECT id FROM profiles WHERE tenant_id = financial_transactions.tenant_id
    ));

CREATE POLICY "Tenants can manage their own assets" 
    ON assets FOR ALL USING (auth.uid() IN (
        SELECT id FROM profiles WHERE tenant_id = assets.tenant_id
    ));

CREATE POLICY "Tenants can manage their own documents" 
    ON documents FOR ALL USING (auth.uid() IN (
        SELECT id FROM profiles WHERE tenant_id = documents.tenant_id
    ));
