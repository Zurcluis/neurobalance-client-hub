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
    action?: string;
    token?: string;
    secret?: string;
}

interface AppointmentCandidate {
    id: number;
    titulo: string | null;
    data: string;
    hora: string;
    estado: string;
    id_cliente: number;
    clientes: { nome: string | null; telefone: string | null } | null;
}

const REMINDER_SMS_TYPE = 'lembrete_24h';
const REMINDER_WINDOW_HOURS = 48;
const REMINDER_LOOKAHEAD_DAYS = 7;

const pad2 = (value: number) => String(value).padStart(2, '0');

const toDateKey = (date: Date) =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const parseAppointmentDate = (data: string, hora: string): Date => {
    const [year, month, day] = (data || '').slice(0, 10).split('-').map(Number);
    const [hours, minutes] = (hora || '00:00').split(':').map(Number);
    return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0);
};

const getTwilioConfig = () => {
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const senderId = Deno.env.get('TWILIO_SENDER_ID');
    const phoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    return {
        accountSid,
        authToken,
        from: senderId || phoneNumber || '',
        configured: Boolean(accountSid && authToken && (senderId || phoneNumber)),
    };
};

const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
    });

const sendTwilioMessage = async (
    config: ReturnType<typeof getTwilioConfig>,
    to: string,
    message: string,
    callbackUrl: string
): Promise<{ ok: true; sid: string; status: string } | { ok: false; error: string }> => {
    const auth = btoa(`${config.accountSid}:${config.authToken}`);
    const body = new URLSearchParams();
    body.append('To', to);
    body.append('From', config.from);
    body.append('Body', message);
    if (callbackUrl) body.append('StatusCallback', callbackUrl);

    const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
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
    if (!response.ok) return { ok: false, error: result.message || 'Twilio Error' };
    return { ok: true, sid: result.sid, status: result.status };
};

const handleRemindersRun = async (supabase: any, body: SMSRequest) => {
    const cronSecret = Deno.env.get('REMINDERS_CRON_SECRET');
    if (cronSecret && body.secret !== cronSecret) {
        return json({ error: 'Unauthorized' }, 401);
    }

    const config = getTwilioConfig();
    if (!config.configured) {
        return json({
            configured: false,
            sent: 0,
            skipped: 0,
            failed: 0,
            message: 'Twilio credentials missing. Lembretes SMS desativados.',
        });
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_HOURS * 60 * 60 * 1000);

    const { data: candidates, error } = await supabase
        .from('agendamentos')
        .select('id, titulo, data, hora, estado, id_cliente, clientes (nome, telefone)')
        .in('estado', ['pendente', 'confirmado', 'agendado'])
        .not('id_cliente', 'is', null)
        .gte('data', toDateKey(windowStart))
        .lte('data', toDateKey(windowEnd))
        .order('data', { ascending: true });

    if (error) return json({ error: error.message }, 400);

    const due = ((candidates || []) as AppointmentCandidate[]).filter((apt) => {
        const start = parseAppointmentDate(apt.data, apt.hora);
        return start >= windowStart && start <= windowEnd;
    });

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    if (due.length > 0) {
        const ids = due.map((apt) => apt.id);
        const { data: history } = await supabase
            .from('sms_history')
            .select('id_agendamento')
            .eq('tipo', REMINDER_SMS_TYPE)
            .neq('status', 'failed')
            .in('id_agendamento', ids);

        const alreadySent = new Set((history || []).map((row: { id_agendamento: number }) => row.id_agendamento));

        const projectRef = current_project_ref(Deno.env.get('SUPABASE_URL') || '');
        const callbackUrl = projectRef
            ? `https://${projectRef}.supabase.co/functions/v1/send-sms-reminder`
            : '';

        for (const apt of due) {
            if (alreadySent.has(apt.id)) {
                skipped++;
                continue;
            }

            const telefone = apt.clientes?.telefone?.trim();
            if (!telefone) {
                skipped++;
                continue;
            }

            const formattedTo = telefone.startsWith('+') ? telefone : `+351${telefone}`;
            const start = parseAppointmentDate(apt.data, apt.hora);
            const message = `Lembrete NeuroBalance: a sua sessao esta marcada para ${formatDayMonth(start)} as ${apt.hora}. Obrigado.`;

            const result = await sendTwilioMessage(config, formattedTo, message, callbackUrl);

            if (result.ok) {
                sent++;
                await supabase.from('sms_history').insert({
                    id_cliente: apt.id_cliente,
                    id_agendamento: apt.id,
                    telefone: formattedTo,
                    mensagem: message,
                    tipo: REMINDER_SMS_TYPE,
                    status: result.status || 'sent',
                    twilio_sid: result.sid,
                    metadata: { janela: '24-48h', origem: 'send-sms-reminder' },
                });
            } else {
                failed++;
                await supabase.from('sms_history').insert({
                    id_cliente: apt.id_cliente,
                    id_agendamento: apt.id,
                    telefone: formattedTo,
                    mensagem: message,
                    tipo: REMINDER_SMS_TYPE,
                    status: 'failed',
                    erro: result.error,
                    metadata: { janela: '24-48h', origem: 'send-sms-reminder' },
                });
            }
        }
    }

    return json({ configured: true, sent, skipped, failed, janela: '24-48h' });
};

const handleRemindersStatus = async (supabase: any, body: SMSRequest) => {
    const config = getTwilioConfig();

    if (!body.token) {
        return json({ configured: config.configured, authorized: false, reminders: [] });
    }

    const { data: tokenData } = await supabase.rpc('validate_client_token', {
        token_value: body.token,
    });

    const tokenRow = Array.isArray(tokenData) ? tokenData[0] : null;
    if (!tokenRow || !tokenRow.is_valid) {
        return json({ configured: config.configured, authorized: false, reminders: [] });
    }

    const clientId = tokenRow.client_id;
    const now = new Date();
    const lookahead = new Date(now.getTime() + REMINDER_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);

    const { data: appointments } = await supabase
        .from('agendamentos')
        .select('id, data, hora, estado')
        .eq('id_cliente', clientId)
        .not('estado', 'in', '("cancelado","realizado")')
        .gte('data', toDateKey(now))
        .lte('data', toDateKey(lookahead))
        .order('data', { ascending: true })
        .limit(20);

    const list = (appointments || []) as AppointmentCandidate[];

    if (list.length === 0) {
        return json({ configured: config.configured, authorized: true, reminders: [] });
    }

    const ids = list.map((apt) => apt.id);
    const { data: history } = await supabase
        .from('sms_history')
        .select('id_agendamento, status, enviado_em')
        .eq('tipo', REMINDER_SMS_TYPE)
        .neq('status', 'failed')
        .in('id_agendamento', ids);

    const historyByAppointment = new Map(
        (history || []).map((row: { id_agendamento: number; status: string; enviado_em: string | null }) => [
            row.id_agendamento,
            row,
        ])
    );

    const reminders = list.map((apt) => {
        const record = historyByAppointment.get(apt.id);
        if (record) {
            return { id_agendamento: apt.id, estado_sms: 'enviado', enviado_em: record.enviado_em };
        }
        const start = parseAppointmentDate(apt.data, apt.hora);
        const hoursUntil = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
        return {
            id_agendamento: apt.id,
            estado_sms: hoursUntil <= REMINDER_WINDOW_HOURS ? 'agendado' : 'programado',
            enviado_em: null,
        };
    });

    return json({ configured: config.configured, authorized: true, reminders });
};

const formatDayMonth = (date: Date) => `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(supabaseUrl, supabaseServiceRole);

        const contentType = req.headers.get("content-type") || "";

        if (contentType.includes("form-urlencoded")) {
            const formData = await req.formData();
            const smsSid = formData.get("MessageSid") as string;
            const smsStatus = formData.get("SmsStatus") as string;

            console.log(`Status Update: SID ${smsSid} is now ${smsStatus}`);

            if (smsSid) {
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

            return json({ received: true });
        }

        const body = await req.json() as SMSRequest;

        if (body.action === 'reminders-run') {
            return await handleRemindersRun(supabase, body);
        }

        if (body.action === 'reminders-status') {
            return await handleRemindersStatus(supabase, body);
        }

        const { to, message, id_notificacao, id_historico } = body;

        if (!to || !message) {
            throw new Error("Phone number (to) and message are required.");
        }

        const config = getTwilioConfig();

        if (!config.configured) {
            throw new Error("Twilio credentials missing.");
        }

        let formattedTo = to.trim();
        if (!formattedTo.startsWith('+')) formattedTo = '+351' + formattedTo;

        const PROJECT_REF = Deno.env.get('SUPABASE_PROJECT_REF') || current_project_ref(supabaseUrl);
        const callbackUrl = `https://${PROJECT_REF}.supabase.co/functions/v1/send-sms-reminder`;

        const result = await sendTwilioMessage(config, formattedTo, message, callbackUrl);
        if (!result.ok) throw new Error(result.error);

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

        return json({ success: true, sid: result.sid, status: result.status })
    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return json({ error: errorMessage }, 400)
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
