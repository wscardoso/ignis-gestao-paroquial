import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function repair() {
    console.log('--- REPAIRING DB STATE ---');

    // 1. Check Tenants
    const { data: tenants } = await supabase.from('tenants').select('*');
    let activeTenantId: string;

    if (!tenants || tenants.length === 0) {
        console.log('No tenants found. Creating default...');
        const { data: newTenant, error: tError } = await supabase
            .from('tenants')
            .insert([{ name: 'Paróquia Cenáculo Dev', status: 'active', slogan: 'Sistema de Gestão Pastoral' }])
            .select()
            .single();
        if (tError) throw tError;
        activeTenantId = newTenant.id;
        console.log('Tenant created:', activeTenantId);
    } else {
        activeTenantId = tenants[0].id;
        console.log('Found tenant:', activeTenantId);
    }

    // 2. Check Sub Tenants (Communities)
    const { data: communities } = await supabase
        .from('sub_tenants')
        .select('*')
        .eq('tenant_id', activeTenantId);

    if (!communities || communities.length === 0) {
        console.log('No communities found for tenant. Creating default Matriz...');
        const { data: newSub, error: sError } = await supabase
            .from('sub_tenants')
            .insert([{
                tenant_id: activeTenantId,
                name: 'Matriz Principal',
                address: 'Centro, Cidade'
            }])
            .select()
            .single();
        if (sError) {
            console.error('Error creating sub_tenant:', sError);
            console.log('Checking if sub_tenants table exists...');
        } else {
            console.log('Community created:', newSub.id);
        }
    } else {
        console.log('Communities found:', communities.length);
    }

    console.log('--- REPAIR COMPLETE ---');
}

repair().catch(console.error);
