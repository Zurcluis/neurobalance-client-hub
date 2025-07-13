import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Send, 
  User, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  MessageCircle,
  Search,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ClientMessage {
  id: number;
  id_cliente: number;
  sender_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  clientes?: {
    nome: string;
    email: string;
    telefone: string;
  };
}

interface ClientConversation {
  clientId: number;
  clientName: string;
  clientEmail: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

const AdminChatPanel: React.FC = () => {
  const [conversations, setConversations] = useState<ClientConversation[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'online'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000); // Atualizar a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      fetchMessages(selectedClientId);
      const interval = setInterval(() => fetchMessages(selectedClientId), 10000); // Atualizar mensagens a cada 10 segundos
      return () => clearInterval(interval);
    }
  }, [selectedClientId]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('client_messages')
        .select(`
          id_cliente,
          message,
          created_at,
          is_read,
          sender_type,
          clientes (
            nome,
            email,
            telefone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupar mensagens por cliente
      const conversationMap = new Map<number, ClientConversation>();
      
      data?.forEach((msg: any) => {
        const clientId = msg.id_cliente;
        const existing = conversationMap.get(clientId);
        
        if (!existing || new Date(msg.created_at) > new Date(existing.lastMessageTime)) {
          const unreadCount = data.filter(m => 
            m.id_cliente === clientId && 
            !m.is_read && 
            m.sender_type === 'client'
          ).length;

          conversationMap.set(clientId, {
            clientId,
            clientName: msg.clientes?.nome || 'Cliente',
            clientEmail: msg.clientes?.email || '',
            lastMessage: msg.message,
            lastMessageTime: msg.created_at,
            unreadCount,
            isOnline: differenceInMinutes(new Date(), new Date(msg.created_at)) < 15
          });
        }
      });

      const conversationsList = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

      setConversations(conversationsList);
    } catch (error: any) {
      console.error('Erro ao carregar conversas:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (clientId: number) => {
    try {
      const { data, error } = await supabase
        .from('client_messages')
        .select(`
          *,
          clientes (
            nome,
            email,
            telefone
          )
        `)
        .eq('id_cliente', clientId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Marcar mensagens do cliente como lidas
      const unreadClientMessages = data?.filter(msg => 
        msg.sender_type === 'client' && !msg.is_read
      );

      if (unreadClientMessages && unreadClientMessages.length > 0) {
        const messageIds = unreadClientMessages.map(msg => msg.id);
        await supabase
          .from('client_messages')
          .update({ is_read: true })
          .in('id', messageIds);
      }
    } catch (error: any) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedClientId) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const { error } = await supabase
        .from('client_messages')
        .insert({
          id_cliente: selectedClientId,
          sender_type: 'admin',
          message: messageText,
          is_read: false
        });

      if (error) throw error;

      toast.success('Mensagem enviada com sucesso');
      await fetchMessages(selectedClientId);
      await fetchConversations();
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
      setNewMessage(messageText); // Restaurar mensagem em caso de erro
    } finally {
      setSending(false);
    }
  };

  const getMessageTime = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      if (isToday(date)) {
        return format(date, 'HH:mm', { locale: ptBR });
      } else if (isYesterday(date)) {
        return 'Ontem ' + format(date, 'HH:mm', { locale: ptBR });
      } else {
        return format(date, 'dd/MM HH:mm', { locale: ptBR });
      }
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

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.clientEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'unread' && conv.unreadCount > 0) ||
                         (filterStatus === 'online' && conv.isOnline);
    
    return matchesSearch && matchesFilter;
  });

  const selectedConversation = conversations.find(conv => conv.clientId === selectedClientId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#3f9094]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
      {/* Lista de Conversas */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Conversas ({conversations.length})
          </CardTitle>
          <CardDescription>
            Mensagens dos clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Filtros */}
          <div className="p-4 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Pesquisar cliente..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as conversas</SelectItem>
                <SelectItem value="unread">Não lidas</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Conversas */}
          <ScrollArea className="h-[500px]">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma conversa encontrada</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.clientId}
                  className={`p-4 cursor-pointer hover:bg-gray-50 border-b transition-colors ${
                    selectedClientId === conv.clientId ? 'bg-blue-50 border-l-4 border-l-[#3f9094]' : ''
                  }`}
                  onClick={() => setSelectedClientId(conv.clientId)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#3f9094] text-white">
                        {getInitials(conv.clientName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm truncate">{conv.clientName}</h3>
                        <div className="flex items-center gap-1">
                          {conv.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conv.unreadCount}
                            </Badge>
                          )}
                          {conv.isOnline && (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {conv.lastMessage}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {getMessageTime(conv.lastMessageTime)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Área de Chat */}
      <Card className="lg:col-span-2">
        {selectedConversation ? (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#3f9094] text-white">
                    {getInitials(selectedConversation.clientName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{selectedConversation.clientName}</h3>
                  <p className="text-sm text-gray-500">{selectedConversation.clientEmail}</p>
                </div>
                {selectedConversation.isOnline && (
                  <Badge className="bg-green-100 text-green-800 ml-auto">
                    Online
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[550px]">
              {/* Mensagens */}
              <ScrollArea className="flex-1 pr-4 mb-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_type === 'admin'
                            ? 'bg-[#3f9094] text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs ${
                            message.sender_type === 'admin' 
                              ? 'text-blue-100' 
                              : 'text-gray-500'
                          }`}>
                            {getMessageTime(message.created_at)}
                          </span>
                          {message.sender_type === 'admin' && (
                            <CheckCircle className="h-3 w-3 text-blue-100" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Formulário de Envio */}
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua resposta..."
                  disabled={sending}
                  className="flex-1"
                  maxLength={500}
                />
                <Button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
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
                <span className="text-xs text-gray-500">
                  Pressione Enter para enviar
                </span>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
              <p className="text-gray-500">
                Escolha um cliente da lista para ver e responder às mensagens
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default AdminChatPanel; 