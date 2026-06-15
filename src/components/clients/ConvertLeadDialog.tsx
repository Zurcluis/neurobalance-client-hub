import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, Mail, Phone, Calendar, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { LandingLead } from '@/types/landing-lead';
import { LeadCompra } from '@/types/lead-compra';
import { toast } from 'sonner';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
  como_conheceu: 'Anúncio' | 'Instagram' | 'Facebook' | 'Recomendação' | 'Flyer';
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
  const [formData, setFormData] = useState<Partial<ConvertedClientData>>({});
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [step, setStep] = useState<'review' | 'complete'>('review');

  // Reset form when lead changes
  React.useEffect(() => {
    if (lead) {
      const initialData: Partial<ConvertedClientData> = {
        nome: lead.nome,
        email: lead.email,
        telefone: lead.telefone,
        estado: 'ongoing',
        tipo_contato: 'Lead',
        como_conheceu: 'Anúncio',
        numero_sessoes: 0,
        total_pago: leadType === 'compra' ? (lead as LeadCompra).valor_pago || 0 : 0,
        max_sessoes: 0,
        id_manual: '',
        notas: leadType === 'landing' 
          ? (lead as LandingLead).observacoes || ''
          : (lead as LeadCompra).observacoes || '',
      };

      // Map gender from LeadCompra
      if (leadType === 'compra') {
        const leadCompra = lead as LeadCompra;
        if (leadCompra.genero === 'Masculino') initialData.genero = 'Homem';
        else if (leadCompra.genero === 'Feminino') initialData.genero = 'Mulher';
        else initialData.genero = 'Outro';
        
        initialData.morada = leadCompra.cidade || '';
      }

      setFormData(initialData);
      setStep('review');
    }
  }, [lead, leadType]);

  const handleInputChange = (field: keyof ConvertedClientData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConvert = async () => {
    if (!formData.id_manual) {
      toast.error('O ID Manual é obrigatório');
      return;
    }

    try {
      await onConvert({
        ...formData,
        data_nascimento: birthDate,
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
              {formData.nome} foi adicionado à lista de clientes.
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

            {/* Form Fields */}
            <div className="space-y-4 mt-4">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Complete os campos obrigatórios para criar o perfil do cliente.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id_manual" className="text-sm font-medium">
                    ID Manual <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="id_manual"
                    value={formData.id_manual || ''}
                    onChange={(e) => handleInputChange('id_manual', e.target.value)}
                    placeholder="Ex: NB001"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genero" className="text-sm font-medium">Género</Label>
                  <Select
                    value={formData.genero}
                    onValueChange={(value) => handleInputChange('genero', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Homem">Homem</SelectItem>
                      <SelectItem value="Mulher">Mulher</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Data de Nascimento</Label>
                  <DatePicker
                    selected={birthDate}
                    onChange={(date) => setBirthDate(date)}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Selecione a data"
                    wrapperClassName="w-full"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Morada</Label>
                  <Input
                    value={formData.morada || ''}
                    onChange={(e) => handleInputChange('morada', e.target.value)}
                    placeholder="Morada completa"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Motivo</Label>
                  <Select
                    value={formData.motivo || ''}
                    onValueChange={(value) => handleInputChange('motivo', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione o motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PHDA">PHDA</SelectItem>
                      <SelectItem value="PEA">PEA</SelectItem>
                      <SelectItem value="Insónias">Insónias</SelectItem>
                      <SelectItem value="Ansiedade">Ansiedade</SelectItem>
                      <SelectItem value="Problemas de Memória">Problemas de Memória</SelectItem>
                      <SelectItem value="Depressão">Depressão</SelectItem>
                      <SelectItem value="Alzheimer">Alzheimer</SelectItem>
                      <SelectItem value="Sobredotado">Sobredotado</SelectItem>
                      <SelectItem value="Atraso no Desenvolvimento">Atraso no Desenvolvimento</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Como Conheceu</Label>
                  <Select
                    value={formData.como_conheceu}
                    onValueChange={(value: any) => handleInputChange('como_conheceu', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Anúncio">Anúncio</SelectItem>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="Recomendação">Recomendação</SelectItem>
                      <SelectItem value="Flyer">Flyer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Notas/Observações</Label>
                <Textarea
                  value={formData.notas || ''}
                  onChange={(e) => handleInputChange('notas', e.target.value)}
                  placeholder="Observações sobre o cliente..."
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>

            <DialogFooter className="mt-6 gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button
                onClick={handleConvert}
                disabled={isLoading || !formData.id_manual}
                className="bg-gradient-to-r from-[#3f9094] to-[#2A5854] hover:opacity-90"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    A converter...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Converter para Cliente
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConvertLeadDialog;

