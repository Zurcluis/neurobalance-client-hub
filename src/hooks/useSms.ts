import { useCallback, useState } from 'react';
import { useSupabaseClient } from './useSupabaseClient';
import { toast } from 'sonner';

export const useSms = () => {
    const supabase = useSupabaseClient();
    const [isSending, setIsSending] = useState(false);

    const sendManualSms = useCallback(async (to: string, message: string, id_agendamento?: number) => {
        setIsSending(true);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const headers: Record<string, string> = {};

            if (sessionData?.session?.access_token) {
                headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
            }

            console.log('Enviando SMS para:', to, 'via Edge Function...');

            const { data, error } = await supabase.functions.invoke('send-sms-reminder', {
                body: { to, message, id_agendamento },
                headers
            });

            if (error) throw error;

            toast.success('SMS enviado com sucesso!');
            return { success: true, data };
        } catch (err: any) {
            console.error('Error sending manual SMS:', err);
            toast.error(`Erro ao enviar SMS: ${err.message || 'Falha na ligação à Edge Function'}`);
            return { success: false, error: err };
        } finally {
            setIsSending(false);
        }
    }, [supabase]);

    return {
        sendManualSms,
        isSending
    };
};
