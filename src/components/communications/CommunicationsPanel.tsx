
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { MessageSquare, Mail, Phone, Send } from 'lucide-react';
import { ClientDetailData } from '@/types/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CommunicationsPanelProps {
  onClose: () => void;
}

const CommunicationsPanel = ({ onClose }: CommunicationsPanelProps) => {
  const [clients, setClients] = useState<ClientDetailData[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [subject, setSubject] = useState<string>('Confirmação de Agendamento');
  const [message, setMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('sms');

  // Load communication type from localStorage
  useEffect(() => {
    const savedType = localStorage.getItem('communicationType');
    if (savedType && ['sms', 'email', 'call'].includes(savedType)) {
      setActiveTab(savedType);
    }
  }, []);

  // Load clients from localStorage
  useEffect(() => {
    const loadedClients = localStorage.getItem('clients');
    if (loadedClients) {
      setClients(JSON.parse(loadedClients));
    }
  }, []);

  // Get client appointments
  const getClientAppointments = (clientId: string) => {
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    return appointments.filter((app: any) => app.clientId === clientId);
  };

  // Generate template messages based on client appointments
  const generateTemplateMessage = (clientId: string, type: string) => {
    if (!clientId) return '';

    const client = clients.find(c => c.id === clientId);
    if (!client) return '';

    const appointments = getClientAppointments(clientId);
    const nextAppointment = appointments.find((app: any) => 
      new Date(app.date) > new Date()
    );

    let template = '';
    
    switch (type) {
      case 'sms':
        if (nextAppointment) {
          const date = new Date(nextAppointment.date);
          const formattedDate = date.toLocaleDateString('pt-PT');
          const formattedTime = date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
          template = `Olá ${client.name},\n\nEstamos a confirmar o seu agendamento de ${nextAppointment.type === 'avaliação' ? 'Avaliação Inicial' : nextAppointment.type === 'sessão' ? 'Neurofeedback' : 'Discussão de Resultados'} para dia ${formattedDate} às ${formattedTime}.\n\nPor favor, confirme a sua presença.\n\nObrigado,\nNeuroBalance Clinic`;
        } else {
          template = `Olá ${client.name},\n\nGostaríamos de agendar a sua próxima sessão na NeuroBalance Clinic.\n\nPor favor, entre em contacto connosco para marcar uma data conveniente.\n\nObrigado,\nNeuroBalance Clinic`;
        }
        break;
      case 'email':
        if (nextAppointment) {
          const date = new Date(nextAppointment.date);
          const formattedDate = date.toLocaleDateString('pt-PT');
          const formattedTime = date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
          template = `Prezado(a) ${client.name},\n\nEsperamos que esta mensagem o(a) encontre bem.\n\nEstamos a escrever para confirmar o seu agendamento para ${nextAppointment.type === 'avaliação' ? 'Avaliação Inicial' : nextAppointment.type === 'sessão' ? 'sessão de Neurofeedback' : 'Discussão de Resultados'} marcado para ${formattedDate} às ${formattedTime}.\n\nPor favor, confirme a sua presença respondendo a este e-mail ou ligando para o nosso número de telefone.\n\nEstamos ansiosos para recebê-lo(a).\n\nCom os melhores cumprimentos,\nEquipa NeuroBalance Clinic`;
        } else {
          template = `Prezado(a) ${client.name},\n\nEsperamos que esta mensagem o(a) encontre bem.\n\nGostaríamos de agendar a sua próxima sessão na NeuroBalance Clinic. Por favor, entre em contacto connosco para marcar uma data conveniente.\n\nEstamos ansiosos para recebê-lo(a) novamente.\n\nCom os melhores cumprimentos,\nEquipa NeuroBalance Clinic`;
        }
        break;
      case 'call':
        if (nextAppointment) {
          const date = new Date(nextAppointment.date);
          const formattedDate = date.toLocaleDateString('pt-PT');
          const formattedTime = date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
          template = `Notas para chamada com ${client.name}:\n\n- Confirmar o agendamento para ${formattedDate} às ${formattedTime}\n- Verificar se há alguma dúvida sobre a ${nextAppointment.type === 'avaliação' ? 'avaliação inicial' : nextAppointment.type === 'sessão' ? 'sessão de neurofeedback' : 'discussão de resultados'}\n- Lembrar de trazer documentos necessários (se aplicável)\n- Confirmar dados de contacto`;
        } else {
          template = `Notas para chamada com ${client.name}:\n\n- Verificar disponibilidade para próxima sessão\n- Discutir progresso das sessões anteriores\n- Verificar se há alguma dúvida ou preocupação\n- Confirmar dados de contacto atualizados`;
        }
        break;
      default:
        template = '';
    }
    
    return template;
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setMessage(generateTemplateMessage(clientId, activeTab));
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (selectedClientId) {
      setMessage(generateTemplateMessage(selectedClientId, value));
    }
    localStorage.setItem('communicationType', value);
  };

  const handleSend = () => {
    if (!selectedClientId) {
      toast.error('Por favor, selecione um cliente.');
      return;
    }

    if (!message) {
      toast.error('Por favor, insira uma mensagem.');
      return;
    }

    // Simulate sending communication
    toast.success(`${activeTab === 'sms' ? 'SMS' : activeTab === 'email' ? 'Email' : 'Chamada'} registrada com sucesso!`);
    
    // Save communication record to localStorage
    const communications = JSON.parse(localStorage.getItem('communications') || '[]');
    const client = clients.find(c => c.id === selectedClientId);
    
    const newCommunication = {
      id: Date.now().toString(),
      clientId: selectedClientId,
      clientName: client?.name,
      type: activeTab,
      subject: activeTab === 'email' ? subject : 'N/A',
      message: message,
      date: new Date().toISOString(),
      status: 'sent'
    };
    
    communications.push(newCommunication);
    localStorage.setItem('communications', JSON.stringify(communications));
    
    // Close panel
    setTimeout(onClose, 1000);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>SMS</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </TabsTrigger>
          <TabsTrigger value="call" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>Chamada</span>
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2">Cliente</h4>
          <Select value={selectedClientId} onValueChange={handleClientChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name} ({client.phone})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <TabsContent value="sms" className="space-y-4">
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Mensagem SMS</h4>
            <Textarea 
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva a mensagem SMS aqui..."
              className="min-h-[200px]"
            />
          </div>
          
          <div className="text-xs text-gray-500">
            <p>O cliente receberá esta mensagem como SMS no número: {selectedClientId ? clients.find(c => c.id === selectedClientId)?.phone : 'Selecione um cliente'}</p>
          </div>
        </TabsContent>
        
        <TabsContent value="email" className="space-y-4">
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Assunto</h4>
            <Input 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              placeholder="Assunto do email"
            />
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Mensagem Email</h4>
            <Textarea 
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva o corpo do email aqui..."
              className="min-h-[200px]"
            />
          </div>
          
          <div className="text-xs text-gray-500">
            <p>O cliente receberá este email em: {selectedClientId ? clients.find(c => c.id === selectedClientId)?.email : 'Selecione um cliente'}</p>
          </div>
        </TabsContent>
        
        <TabsContent value="call" className="space-y-4">
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Notas para a Chamada</h4>
            <Textarea 
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva notas para guiar a chamada aqui..."
              className="min-h-[200px]"
            />
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Número para Chamada</h4>
            <div className="flex items-center justify-between p-3 bg-white/50 rounded-md">
              <span>{selectedClientId ? clients.find(c => c.id === selectedClientId)?.phone : 'Selecione um cliente'}</span>
              {selectedClientId && (
                <a 
                  href={`tel:${clients.find(c => c.id === selectedClientId)?.phone}`}
                  className="text-[#3f9094] flex items-center gap-1 hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  <span>Ligar</span>
                </a>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleSend}
          className="bg-[#3f9094] hover:bg-[#265255] flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {activeTab === 'call' ? 'Registrar Chamada' : `Enviar ${activeTab === 'sms' ? 'SMS' : 'Email'}`}
        </Button>
      </div>
    </div>
  );
};

export default CommunicationsPanel;
