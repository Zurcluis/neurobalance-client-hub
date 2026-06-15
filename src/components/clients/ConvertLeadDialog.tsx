import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, Mail, Phone, CheckCircle2, ArrowRight } from 'lucide-react';
import { LandingLead } from '@/types/landing-lead';
import { LeadCompra } from '@/types/lead-compra';
import 'react-datepicker/dist/react-datepicker.css';
import ClientForm, { ClientFormData } from './ClientForm';

interface ConvertLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LandingLead | LeadCompra | null;
  leadType: 'landing' | 'compra';
  onConvert: (clientData: ConvertedClientData) => Promise<void>;
  isLoading?: boolean;
}

export interface ConvertedClientData {
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: Date | null;
  genero: 'Homem' | 'Mulher' | 'Outro';
  morada: string;
  notas: string;
  estado: 'ongoing' | 'thinking' | 'no-need' | 'finished' | 'desistiu';
  tipo_contato: 'Lead' | 'Contato' | 'Email' | 'Instagram' | 'Facebook';
  como_conheceu: 'Instagram' | 'TikTok' | 'Facebook' | 'Site' | 'Anúncios' | 'Recomendação' | 'Pesquisa na internet' | 'Flyer';
  numero_sessoes: number;
  total_pago: number;
  max_sessoes: number;
  responsavel: string | null;
  motivo: string | null;
  id_manual: string;
  lead_id?: string;
  lead_type?: 'landing' | 'compra';
}

const ConvertLeadDialog: React.FC<ConvertLeadDialogProps> = ({
  open,
  onOpenChange,
  lead,
  leadType,
  onConvert,
  isLoading = false
}) => {
  const [step, setStep] = useState<'review' | 'complete'>('review');

  // React to reset step when opened
  React.useEffect(() => {
    if (open) {
      setStep('review');
    }
  }, [open]);

  const defaultValues = React.useMemo(() => {
    if (!lead) return {};
    
    const initialData: Partial<ClientFormData> = {
      nome: lead.nome,
      email: lead.email,
      telefone: lead.telefone,
      estado: 'ongoing',
      tipo_contato: 'Lead',
      como_conheceu: (leadType === 'landing' ? (lead as LandingLead).origem : 'Instagram') as any,
      numero_sessoes: 0,
      total_pago: leadType === 'compra' ? (lead as LeadCompra).valor_pago || 0 : 0,
      max_sessoes: 0,
      id_manual: '',
      notas: leadType === 'landing' 
        ? (lead as LandingLead).observacoes || ''
        : (lead as LeadCompra).observacoes || '',
      data_entrada_clinica: new Date(),
    };

    if (leadType === 'compra') {
      const leadCompra = lead as LeadCompra;
      if (leadCompra.genero === 'Masculino') initialData.genero = 'Homem';
      else if (leadCompra.genero === 'Feminino') initialData.genero = 'Mulher';
      else initialData.genero = 'Outro';
      
      initialData.morada = leadCompra.cidade || '';
    } else {
      const landingLead = lead as LandingLead;
      initialData.morada = landingLead.morada || '';
    }

    return initialData;
  }, [lead, leadType]);

  const handleConvert = async (data: ClientFormData) => {
    try {
      await onConvert({
        ...data,
        email: data.email || '',
        notas: data.notas || '',
        numero_sessoes: data.numero_sessoes || 0,
        total_pago: data.total_pago || 0,
        max_sessoes: data.max_sessoes || 0,
        responsavel: data.responsavel || null,
        motivo: data.motivo || null,
        id_manual: data.id_manual || '',
        lead_id: lead?.id,
        lead_type: leadType,
      } as ConvertedClientData);
      
      setStep('complete');
      setTimeout(() => {
        onOpenChange(false);
        setStep('review');
      }, 2000);
    } catch (error) {
      console.error('Erro ao converter lead:', error);
    }
  };

  if (!lead) return null;

  const isLandingLead = leadType === 'landing';
  const landingLead = isLandingLead ? (lead as LandingLead) : null;
  const compraLead = !isLandingLead ? (lead as LeadCompra) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="h-6 w-6 text-[#3f9094]" />
            Converter Lead em Cliente
          </DialogTitle>
          <DialogDescription>
            Preencha os dados adicionais para criar o perfil do cliente
          </DialogDescription>
        </DialogHeader>

        {step === 'complete' ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Cliente Criado com Sucesso!
            </h3>
            <p className="text-gray-600">
              {lead.nome} foi adicionado à lista de clientes.
            </p>
          </div>
        ) : (
          <>
            {/* Lead Info Card */}
            <Card className="bg-gradient-to-br from-[#E6ECEA]/50 to-white border-[#3f9094]/20">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{lead.nome}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {isLandingLead ? 'Landing Page' : 'Lead Compra'}
                      </Badge>
                      {landingLead && (
                        <Badge 
                          className={`text-xs ${
                            landingLead.status === 'Avaliação Realizada' ? 'bg-green-100 text-green-800' :
                            landingLead.status === 'Vai Iniciar' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {landingLead.status}
                        </Badge>
                      )}
                      {compraLead && (
                        <Badge className="text-xs bg-purple-100 text-purple-800">
                          {compraLead.tipo}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-[#3f9094]" />
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{lead.telefone}</span>
                  </div>
                  {compraLead && compraLead.valor_pago > 0 && (
                    <div className="col-span-2 mt-1">
                      <span className="text-green-600 font-medium">
                        Valor pago: €{compraLead.valor_pago.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Form Fields using ClientForm */}
            <div className="mt-4 border-t pt-4">
              <ClientForm 
                onSubmit={handleConvert} 
                onCancel={() => onOpenChange(false)} 
                defaultValues={defaultValues}
                isSubmitting={isLoading}
                isEditing={false}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConvertLeadDialog;

