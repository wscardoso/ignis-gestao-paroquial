import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID")
const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
        const { appointmentId } = await req.json()

        // 1. Buscar dados do agendamento
        const { data: appointment, error: fetchError } = await supabase
            .from('appointments')
            .select(`
        id, 
        client_name, 
        client_phone, 
        start_time, 
        service_type,
        tenants (name)
      `)
            .eq('id', appointmentId)
            .single()

        if (fetchError || !appointment) throw new Error("Agendamento não encontrado")

        const { client_name, client_phone, start_time, service_type, tenants } = appointment
        const paroquiaNome = tenants?.name || "Paróquia"

        // Formatar data/hora
        const date = new Date(start_time)
        const formattedDate = date.toLocaleDateString('pt-BR')
        const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

        // 2. Limpar número de telefone (remover caracteres não numéricos)
        const phone = client_phone.replace(/\D/g, "")
        const formattedPhone = phone.startsWith("55") ? phone : `55${phone}`

        // 3. Montar mensagem
        const message = `Paz e Benção, ${client_name}! \n\nAqui é da *${paroquiaNome}*. Confirmamos seu agendamento de *${service_type}* para o dia *${formattedDate}* às *${formattedTime}*.\n\nEstamos esperando por você! 🙏`

        // 4. Enviar para Z-API
        const zapiResponse = await fetch(`https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                phone: formattedPhone,
                message: message
            })
        })

        const result = await zapiResponse.json()

        // 5. Atualizar status no banco
        if (zapiResponse.ok) {
            await supabase
                .from('appointments')
                .update({ whatsapp_status: 'sent' })
                .eq('id', appointmentId)
        } else {
            await supabase
                .from('appointments')
                .update({ whatsapp_status: 'error' })
                .eq('id', appointmentId)
            console.error("Z-API Error:", result)
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
