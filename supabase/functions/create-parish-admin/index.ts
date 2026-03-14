import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Validate caller is super_admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const callerId = claimsData.claims.sub
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Check caller role
    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', callerId)
      .single()

    if (!callerProfile || callerProfile.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: only super_admin can onboard parishes' }), { status: 403, headers: corsHeaders })
    }

    // Parse request body
    const { name, cnpj, diocese, adminName, adminEmail, adminPassword, modules } = await req.json()

    if (!name || !adminEmail || !adminPassword) {
      return new Response(JSON.stringify({ error: 'Missing required fields: name, adminEmail, adminPassword' }), { status: 400, headers: corsHeaders })
    }

    // 1. Create tenant
    const { data: tenant, error: tenantError } = await adminClient
      .from('tenants')
      .insert({
        name,
        cnpj: cnpj || null,
        slogan: diocese || null,
        active_modules: modules && modules.length > 0 ? modules : ['sacramenta', 'missio', 'pastoralis'],
        status: 'active',
      })
      .select()
      .single()

    if (tenantError) {
      return new Response(JSON.stringify({ error: `Failed to create tenant: ${tenantError.message}` }), { status: 500, headers: corsHeaders })
    }

    // 2. Create auth user
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: adminName || name },
    })

    if (authError) {
      // Rollback tenant
      await adminClient.from('tenants').delete().eq('id', tenant.id)
      return new Response(JSON.stringify({ error: `Failed to create user: ${authError.message}` }), { status: 500, headers: corsHeaders })
    }

    // 3. Update profile (trigger already created it with role 'fiel')
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        role: 'matriz_admin',
        tenant_id: tenant.id,
        full_name: adminName || name,
      })
      .eq('id', authUser.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
    }

    // 4. Create default sub_tenant
    const { error: subError } = await adminClient
      .from('sub_tenants')
      .insert({
        tenant_id: tenant.id,
        name: 'Matriz Principal',
        address: '',
      })

    if (subError) {
      console.error('Sub-tenant creation error:', subError)
    }

    return new Response(
      JSON.stringify({ tenantId: tenant.id, userId: authUser.user.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})
