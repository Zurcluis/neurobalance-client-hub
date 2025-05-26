import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Lightbulb, Plus, Database } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createSamplePayment } from '@/hooks/usePayments';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/use-language';

const EmptyFinanceState = () => {
  const { t } = useLanguage();
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const [showTableHelpDialog, setShowTableHelpDialog] = useState(false);

  const handleCreateDemo = async () => {
    try {
      setIsCreatingDemo(true);
      const result = await createSamplePayment();
      if (!result) {
        // Se não foi possível criar o pagamento, pode ser problema com a tabela
        setShowTableHelpDialog(true);
      }
    } catch (error) {
      console.error('Erro ao criar pagamento de demonstração:', error);
      toast.error('Não foi possível criar pagamento de demonstração');
    } finally {
      setIsCreatingDemo(false);
    }
  };

  return (
    <>
      <div className="text-center py-12 bg-white/5 rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
        <div className="max-w-md mx-auto">
          <Lightbulb className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">{t('noFinancialData')}</h3>
          <p className="text-muted-foreground mb-6">
            Ainda não há pagamentos registrados. Adicione manualmente ou crie um registro de demonstração.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {t('addPayment')}
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleCreateDemo}
              disabled={isCreatingDemo}
            >
              {isCreatingDemo ? (
                <div className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full" />
              ) : (
                <Lightbulb className="w-4 h-4" />
              )}
              Criar Demonstração
            </Button>
            <Button 
              variant="ghost" 
              className="gap-2"
              onClick={() => setShowTableHelpDialog(true)}
            >
              <Database className="w-4 h-4" />
              Configurar Banco
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog de ajuda para criar tabela */}
      <Dialog open={showTableHelpDialog} onOpenChange={setShowTableHelpDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configuração da Tabela de Pagamentos</DialogTitle>
            <DialogDescription>
              É necessário configurar a tabela de pagamentos no banco de dados para usar esta funcionalidade.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm">
              Parece que a tabela <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">pagamentos</code> não existe no seu banco de dados Supabase. Siga estas instruções para criá-la:
            </p>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">1. Acesse o Painel do Supabase</h4>
              <p className="text-sm">Entre no painel do Supabase e navegue até o projeto utilizado nesta aplicação.</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">2. Abra o Editor SQL</h4>
              <p className="text-sm">No menu lateral, clique em "Table Editor" e depois em "SQL Editor".</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">3. Execute o SQL para criar a tabela</h4>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                <pre className="text-xs">
{`CREATE TABLE public.pagamentos (
  id SERIAL PRIMARY KEY,
  id_cliente INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  valor DECIMAL(10, 2) NOT NULL,
  data DATE NOT NULL,
  tipo VARCHAR(255) NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- Adicionar políticas de segurança
CREATE POLICY "Permitir acesso a pagamentos para usuários autenticados"
  ON public.pagamentos
  USING (auth.role() = 'authenticated');

-- Comentários para documentação
COMMENT ON TABLE public.pagamentos IS 'Tabela de pagamentos de clientes';`}
                </pre>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">4. Atualize esta página</h4>
              <p className="text-sm">Após criar a tabela, atualize esta página para começar a usar os recursos financeiros.</p>
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowTableHelpDialog(false)}
              >
                Entendi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EmptyFinanceState;
