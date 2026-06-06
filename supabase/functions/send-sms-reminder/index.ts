import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface SMSRequest {
    to?: string;
    message?: string;
    id_agendamento?: number;
    id_notificacao?: number;
    id_historico?: number;
    SmsStatus?: string;
    MessageSid?: string;
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(supabaseUrl, supabaseServiceRole);

        // Twilio envia updates via application/x-www-form-urlencoded
        const contentType = req.headers.get("content-type") || "";

        if (contentType.includes("form-urlencoded")) {
            const formData = await req.formData();
            const smsSid = formData.get("MessageSid") as string;
            const smsStatus = formData.get("SmsStatus") as string;

            console.log(`Status Update: SID ${smsSid} is now ${smsStatus}`);

            if (smsSid) {
                // Atualizar em ambas as tabelas se o SID existir
                await Promise.all([
                    supabase
                        .from('client_notifications')
                        .update({ sms_status: smsStatus })
                        .eq('sms_sid', smsSid),
                    supabase
                        .from('sms_history')
                        .update({
                            status: smsStatus,
                            entregue_em: (smsStatus === 'delivered' || smsStatus === 'undelivered' || smsStatus === 'failed') ? new Date().toISOString() : null
                        })
                        .eq('twilio_sid', smsSid)
                ]);
            }

            return new Response(JSON.stringify({ received: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        }

        // Caso normal: Envio de SMS (JSON)
        const { to, message, id_agendamento, id_notificacao, id_historico } = await req.json() as SMSRequest;

        if (!to || !message) {
            throw new Error("Phone number (to) and message are required.");
        }

        const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
        const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
        const TWILIO_SENDER_ID = Deno.env.get('TWILIO_SENDER_ID');
        const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');
        const PROJECT_REF = Deno.env.get('SUPABASE_PROJECT_REF') || current_project_ref(supabaseUrl);

        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
            throw new Error("Twilio credentials missing.");
        }

        let formattedTo = to.trim();
        if (!formattedTo.startsWith('+')) formattedTo = '+351' + formattedTo;

        const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
        const body = new URLSearchParams();
        body.append('To', formattedTo);
        body.append('From', TWILIO_SENDER_ID || TWILIO_PHONE_NUMBER || '');
        body.append('Body', message);

        // URL de Callback para a Twilio nos avisar da entrega
        const callbackUrl = `https://${PROJECT_REF}.supabase.co/functions/v1/send-sms-reminder`;
        body.append('StatusCallback', callbackUrl);

        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: body.toString(),
            }
        );

        const result = await response.json();

        if (!response.ok) throw new Error(result.message || "Twilio Error");

        // Guardar o SID nas tabelas correspondentes
        const updates = [];
        if (id_notificacao) {
            updates.push(
                supabase
                    .from('client_notifications')
                    .update({ sms_sid: result.sid, sms_status: result.status })
                    .eq('id', id_notificacao)
            );
        }

        if (id_historico) {
            updates.push(
                supabase
                    .from('sms_history')
                    .update({ twilio_sid: result.sid, status: result.status })
                    .eq('id', id_historico)
            );
        }

        if (updates.length > 0) {
            await Promise.all(updates);
        }

        return new Response(
            JSON.stringify({ success: true, sid: result.sid, status: result.status }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})

function current_project_ref(url: string): string {
    try {
        const host = new URL(url).hostname;
        return host.split('.')[0];
    } catch {
        return '';
    }
}
