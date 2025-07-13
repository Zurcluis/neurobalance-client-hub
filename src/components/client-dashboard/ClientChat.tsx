import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Send, 
  User, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Phone,
  Mail
} from 'lucide-react';
import { useClientMessages } from '@/hooks/useClientAuth';
import { toast } from 'sonner';
import { format, parseISO, subHours, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientChatProps {
  clientId: number;
}

const MESSAGE_LIMIT = 5; // Limite de mensagens do cliente

const ClientChat: React.FC<ClientChatProps> = ({ clientId }) => {
  const { messages, loading, error, sendMessage, markAsRead } = useClientMessages();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const clientMessagesInLast24Hours = useMemo(() => {
    const twentyFourHoursAgo = subHours(new Date(), 24);
    return messages.filter(msg => {
      if (msg.sender_type !== 'client') return false;
      try {
        return isAfter(parseISO(msg.created_at), twentyFourHoursAgo);
      } catch {
        return false;
      }
    }).length;
  }, [messages]);

  const isLimitReached = clientMessagesInLast24Hours >= MESSAGE_LIMIT;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Marcar mensagens não lidas como lidas quando o componente é montado
  useEffect(() => {
    const unreadMessages = messages.filter(msg => !msg.is_read && msg.sender_type === 'admin');
    unreadMessages.forEach(msg => {
      markAsRead(msg.id);
    });
  }, [messages, markAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLimitReached) {
      toast.error("Você atingiu o limite de 5 mensagens nas últimas 24 horas. Tente novamente mais tarde.");
      return;
    }

    if (!newMessage.trim()) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const success = await sendMessage(messageText);
      if (success) {
        toast.success('Mensagem enviada com sucesso');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setNewMessage(messageText); // Restaurar mensagem em caso de erro
    } finally {
      setSending(false);
    }
  };

  const getMessageTime = (timestamp: string) => {
    try {
      return format(parseISO(timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#3f9094]" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informações do Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat Privado com a Equipa
          </CardTitle>
          <CardDescription>
            Comunique diretamente com a equipa da NeuroBalance para esclarecer dúvidas ou partilhar informações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-[#3f9094] text-white">
                NB
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Equipa NeuroBalance</h3>
              <p className="text-sm text-blue-700">
                Disponível para responder às suas questões
              </p>
            </div>
            <Badge className="bg-green-100 text-green-800">
              Online
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Área de Mensagens */}
      <Card className="flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center justify-between">
            <span>Mensagens</span>
            <span className="text-sm text-gray-500">
              {messages.length} mensagem{messages.length !== 1 ? 's' : ''}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Lista de Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma mensagem ainda</p>
                <p className="text-sm">Inicie uma conversa enviando uma mensagem</p>
              </div>
            ) : (
              [...messages]
                .sort((a, b) => parseISO(a.created_at).getTime() - parseISO(b.created_at).getTime())
                .map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_type === 'client'
                          ? 'bg-[#3f9094] text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.sender_type === 'admin' && (
                          <Avatar className="h-6 w-6 flex-shrink-0 mt-1">
                            <AvatarFallback className="bg-[#3f9094] text-white text-xs">
                              NB
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex-1">
                          <p className="text-sm">{message.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs ${
                              message.sender_type === 'client' 
                                ? 'text-blue-100' 
                                : 'text-gray-500'
                            }`}>
                              {getMessageTime(message.created_at)}
                            </span>
                            {message.sender_type === 'client' && (
                              <CheckCircle className="h-3 w-3 text-blue-100" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulário de Envio */}
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isLimitReached ? "Limite diário de mensagens atingido" : "Digite sua mensagem..."}
                disabled={sending || isLimitReached}
                className="flex-1"
                maxLength={500}
              />
              <Button
                type="submit"
                disabled={sending || !newMessage.trim() || isLimitReached}
                className="bg-[#3f9094] hover:bg-[#2d6b6e]"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {newMessage.length}/500 caracteres
              </span>
              {isLimitReached ? (
                <span className="text-xs text-red-500 font-semibold">Limite diário atingido</span>
              ) : (
                <span className="text-xs text-gray-500">
                  Pressione Enter para enviar
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações de Contacto Alternativo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contactos Alternativos
          </CardTitle>
          <CardDescription>
            Outras formas de entrar em contacto connosco
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="h-5 w-5 text-[#3f9094]" />
              <div>
                <p className="font-medium">Telefone</p>
                <p className="text-sm text-gray-600">+351 XXX XXX XXX</p>
                <p className="text-xs text-gray-500">Horário: 9h às 18h (dias úteis)</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-[#3f9094]" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-gray-600">info@neurobalance.pt</p>
                <p className="text-xs text-gray-500">Resposta em até 24 horas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diretrizes do Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Diretrizes do Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Use este chat para dúvidas sobre tratamentos, agendamentos e questões administrativas</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Nossa equipa responde normalmente dentro de 2-4 horas durante o horário comercial</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p>Para emergências médicas, contacte diretamente o seu médico ou serviços de emergência</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p>Mantenha as mensagens respeitosas e relacionadas ao seu tratamento</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientChat; 