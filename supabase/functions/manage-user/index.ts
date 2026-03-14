import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify caller is super_admin
    const authHeader = req.headers.get('Authorization')!
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) throw new Error('Não autenticado')

    const { data: callerProfile } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'super_admin') {
      throw new Error('Acesso negado: apenas Super Admin')
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const body = await req.json()
    const { action } = body

    if (action === 'create') {
      const { email, password, fullName, role, tenantId } = body

      // Create auth user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })
      if (createError) throw createError

      // Update profile with role and tenant
      const { error: profileError } = await adminClient
        .from('profiles')
        .update({
          full_name: fullName,
          role,
          tenant_id: tenantId,
          status: 'active',
        })
        .eq('id', newUser.user.id)

      if (profileError) {
        // Rollback: delete the auth user
        await adminClient.auth.admin.deleteUser(newUser.user.id)
        throw profileError
      }

      return new Response(
        JSON.stringify({ userId: newUser.user.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'delete') {
      const { userId } = body

      // Delete auth user (cascades to profile via FK)
      const { error } = await adminClient.auth.admin.deleteUser(userId)
      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'update') {
      const { userId, fullName, role, status } = body

      const updateData: Record<string, string> = {}
      if (fullName !== undefined) updateData.full_name = fullName
      if (role !== undefined) updateData.role = role
      if (status !== undefined) updateData.status = status

      const { error } = await adminClient
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Ação inválida')
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
