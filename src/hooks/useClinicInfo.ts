import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClinicInfo {
    id: string;
    nome_clinica: string;
    nif_clinica: string;
    morada: string;
    telefone: string;
    email: string;
    website: string;
    instagram: string;
    facebook: string;
    horario_segunda_sexta: string;
    horario_sabado: string;
    horario_domingo: string;
    diretora_clinica: string;
    descricao_curta: string;
    descricao_longa: string;
    created_at?: string;
    updated_at?: string;
}

export const useClinicInfo = () => {
    const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Buscar dados do Supabase
    const fetchClinicInfo = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('clinic_info' as any)
                .select('*')
                .single();

            if (fetchError) {
                console.error('Error fetching clinic info:', fetchError);
                setError(fetchError.message);
                return null;
            }

            if (data) {
                setClinicInfo(data as any);
                return data as any;
            }

            return null;
        } catch (err) {
            console.error('Unexpected error:', err);
            setError('Erro inesperado ao carregar informações');
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // Atualizar dados no Supabase
    const updateClinicInfo = async (updates: Partial<ClinicInfo>) => {
        try {
            if (!clinicInfo?.id) {
                throw new Error('Clinic info ID not found');
            }

            const { data, error: updateError } = await supabase
                .from('clinic_info' as any)
                .update(updates)
                .eq('id', clinicInfo.id)
                .select()
                .single();

            if (updateError) {
                console.error('Error updating clinic info:', updateError);
                toast.error('Erro ao atualizar informações');
                throw updateError;
            }

            if (data) {
                setClinicInfo(data as any);
                toast.success('Informações atualizadas com sucesso!');
                return data as any;
            }

            return null;
        } catch (err) {
            console.error('Unexpected error updating:', err);
            toast.error('Erro ao atualizar informações');
            throw err;
        }
    };

    // Carregar dados ao montar o componente
    useEffect(() => {
        fetchClinicInfo();
    }, []);

    return {
        clinicInfo,
        isLoading,
        error,
        fetchClinicInfo,
        updateClinicInfo,
        setClinicInfo, // Para atualizar localmente antes de salvar
    };
};
