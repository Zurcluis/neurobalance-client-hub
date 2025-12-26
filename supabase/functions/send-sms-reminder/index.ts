import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

interface SMSRequest {
    to: string;
    message: string;
    id_agendamento?: number;
}

serve(async (req) => {
    // Tratar chamadas OPTIONS para CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    try {
        const { to, message, id_agendamento } = await req.json() as SMSRequest;

        if (!to || !message) {
            throw new Error("Phone number (to) and message are required.");
        }

        // Configurações do Twilio vindas das variáveis de ambiente do Supabase
        const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
        const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
        const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');
        const TWILIO_SENDER_ID = Deno.env.get('TWILIO_SENDER_ID');

        // Precisamos do SID, Token e OU um número OU um Sender ID
        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || (!TWILIO_PHONE_NUMBER && !TWILIO_SENDER_ID)) {
            return new Response(
                JSON.stringify({ error: "Twilio credentials are not fully configured in Supabase Secrets (Missing SID, Token, or Sender/Phone)." }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
        }

        // Verificação básica de formato de telefone (adicionar + e código do país se necessário)
        let formattedTo = to.trim();
        if (!formattedTo.startsWith('+')) {
            // Assumindo Portugal (+351) se não tiver código, ajuste conforme necessário
            formattedTo = '+351' + formattedTo;
        }

        const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
        const body = new URLSearchParams();
        body.append('To', formattedTo);
        // Priorizar Sender ID (texto) sobre o Número de Telefone
        body.append('From', TWILIO_SENDER_ID || TWILIO_PHONE_NUMBER || '');
        body.append('Body', message);

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

        if (!response.ok) {
            console.error("Twilio API Error:", result);
            throw new Error(result.message || "Failed to send SMS via Twilio.");
        }

        return new Response(
            JSON.stringify({ success: true, message_sid: result.sid }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
