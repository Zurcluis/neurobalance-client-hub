import { useCallback, useState } from 'react';
import { useSupabaseClient } from './useSupabaseClient';
import { toast } from 'sonner';

export interface SmsHistoryItem {
    id: number;
    id_cliente: number | null;
    id_agendamento: number | null;
    telefone: string;
    mensagem: string;
    tipo: string;
    status: string;
    twilio_sid: string | null;
    erro: string | null;
    enviado_em: string;
    entregue_em: string | null;
    clientes?: {
        nome: string;
        id_manual: string | null;
    } | null;
}

export const useSms = () => {
    const supabase = useSupabaseClient();
    const [isSending, setIsSending] = useState(false);
    const [smsHistory, setSmsHistory] = useState<SmsHistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const sendManualSms = useCallback(async (
        to: string,
        message: string,
        id_agendamento?: number,
        id_cliente?: number
    ) => {
        setIsSending(true);
        let historyId: number | null = null;

        try {
            // 1. Primeiro, guardar no histórico com status 'pending'
            const { data: historyData, error: historyError } = await supabase
                .from('sms_history')
                .insert({
                    id_cliente: id_cliente || null,
                    id_agendamento: id_agendamento || null,
                    telefone: to,
                    mensagem: message,
                    tipo: 'manual',
                    status: 'pending'
                })
                .select('id')
                .single();

            if (historyError) {
                console.warn('Erro ao guardar histórico SMS:', historyError);
            } else {
                historyId = historyData?.id;
            }

            // 2. Enviar o SMS via Edge Function
            const { data: sessionData } = await supabase.auth.getSession();
            const headers: Record<string, string> = {};

            if (sessionData?.session?.access_token) {
                headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
            }

            console.log('Enviando SMS para:', to, 'via Edge Function...');

            const { data, error } = await supabase.functions.invoke('send-sms-reminder', {
                body: { to, message, id_agendamento, id_historico: historyId },
                headers
            });

            if (error) throw error;

            // 3. Atualizar o histórico com o status de sucesso
            if (historyId) {
                await supabase
                    .from('sms_history')
                    .update({
                        status: 'sent',
                        twilio_sid: data?.messageSid || null
                    })
                    .eq('id', historyId);
            }

            return { success: true, data };
        } catch (err: any) {
            console.error('Error sending manual SMS:', err);

            // Atualizar o histórico com o erro
            if (historyId) {
                await supabase
                    .from('sms_history')
                    .update({
                        status: 'failed',
                        erro: err.message || 'Erro desconhecido'
                    })
                    .eq('id', historyId);
            }

            toast.error(`Erro ao enviar SMS: ${err.message || 'Falha na ligação à Edge Function'}`);
            return { success: false, error: err };
        } finally {
            setIsSending(false);
        }
    }, [supabase]);

    const fetchSmsHistory = useCallback(async (clientId?: number) => {
        setIsLoadingHistory(true);
        try {
            let query = supabase
                .from('sms_history')
                .select(`
                    *,
                    clientes (
                        nome,
                        id_manual
                    )
                `)
                .order('enviado_em', { ascending: false })
                .limit(100);

            if (clientId) {
                query = query.eq('id_cliente', clientId);
            }

            const { data, error } = await query;

            if (error) throw error;
            setSmsHistory(data || []);
            return data || [];
        } catch (err: any) {
            console.error('Erro ao carregar histórico SMS:', err);
            toast.error('Erro ao carregar histórico de SMS');
            return [];
        } finally {
            setIsLoadingHistory(false);
        }
    }, [supabase]);

    const deleteSms = useCallback(async (smsId: number) => {
        try {
            const { error } = await supabase
                .from('sms_history')
                .delete()
                .eq('id', smsId);

            if (error) throw error;

            // Atualizar lista local
            setSmsHistory(prev => prev.filter(sms => sms.id !== smsId));
            toast.success('SMS apagado do histórico');
            return true;
        } catch (err: any) {
            console.error('Erro ao apagar SMS:', err);
            toast.error('Erro ao apagar SMS');
            return false;
        }
    }, [supabase]);

    return {
        sendManualSms,
        isSending,
        smsHistory,
        fetchSmsHistory,
        isLoadingHistory,
        deleteSms
    };
};
