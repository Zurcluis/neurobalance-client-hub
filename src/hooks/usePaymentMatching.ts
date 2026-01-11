import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SimpleClient {
    id: number;
    nome: string;
    nif: string | null;
}

export const usePaymentMatching = () => {
    const [clients, setClients] = useState<SimpleClient[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchClients = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('clientes')
                .select('id, nome, nif');

            if (!error && data) {
                setClients(data);
            } else {
                console.error('Erro ao buscar clientes:', error);
            }
            setIsLoading(false);
        };

        fetchClients();
    }, []);

    /**
     * Tenta encontrar um cliente correspondente pelo NIF (prioridade) ou Nome.
     */
    const findClient = (name?: string, nif?: string): SimpleClient | undefined => {
        if (!name && !nif) return undefined;

        // 1. Tenta correspondência exata de NIF (se fornecido)
        if (nif) {
            const cleanNif = String(nif).replace(/[^0-9]/g, '');
            if (cleanNif.length > 0) {
                const nifMatch = clients.find(c => {
                    if (!c.nif) return false;
                    const cNif = String(c.nif).replace(/[^0-9]/g, '');
                    return cNif === cleanNif;
                });
                if (nifMatch) return nifMatch;
            }
        }

        // 2. Tenta correspondência difusa de Nome
        if (name) {
            const normalizedInput = name.toLowerCase().trim();

            // Procura exata primeiro
            const exactMatch = clients.find(c => c.nome.toLowerCase().trim() === normalizedInput);
            if (exactMatch) return exactMatch;

            // Procura parcial (o nome do input contido no sistema ou vice-versa)
            // Ex: "João Pedro" no excel pode ser "João Pedro Silva" no sistema
            const partialMatch = clients.find(c => {
                const cName = c.nome.toLowerCase().trim();
                return cName.includes(normalizedInput) || normalizedInput.includes(cName);
            });

            if (partialMatch) return partialMatch;
        }

        return undefined;
    };

    return { clients, isLoading, findClient };
};
