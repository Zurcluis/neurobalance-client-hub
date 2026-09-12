import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  RotateCcw,
  CalendarClock,
  Euro,
  Sparkles
} from 'lucide-react';
import { isToday, isYesterday } from 'date-fns';
import { useClientAuth, useClientMessages } from '@/hooks/useClientAuth';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { ClientMessage } from '@/types/client-dashboard';
import { toast } from 'sonner';
import { format, parseISO, subHours, isAfter } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { parseLocalISO } from '@/utils/dateUtils';

interface ClientChatProps {
  clientId?: number;
}

const MESSAGE_LIMIT = 5;
const MAX_LENGTH = 500;

interface NextAppointmentInfo {
  data: string;
  hora: string;
}

interface QuickReply {
  label: string;
  message: string;
  icon: React.ComponentType<{ className?: string }>;
}

const buildQuickReplies = (nextAppointment: NextAppointmentInfo | null): QuickReply[] => {
  const confirmMessage = nextAppointment
    ? `Olá, gostaria de confirmar a minha sessão de ${format(parseLocalISO(nextAppointment.data), "d 'de' MMMM", { locale: pt })} às ${nextAppointment.hora}. Obrigado.`
    : 'Olá, gostaria de confirmar a minha próxima sessão. Obrigado.';

  return [
    { label: 'Confirmar sessão', message: confirmMessage, icon: CheckCircle },
    {
      label: 'Pedir remarcação',
      message: 'Olá, não vou poder comparecer à sessão marcada. Será possível remarcar? Obrigado.',
      icon: CalendarClock,
    },
    {
      label: 'Questão de pagamento',
      message: 'Olá, tenho uma questão sobre o pagamento das sessões. Podem ajudar-me, por favor?',
      icon: Euro,
    },
    {
      label: 'Horários disponíveis',
      message: 'Olá, gostaria de saber que horários têm disponíveis para marcar uma nova sessão. Obrigado.',
      icon: Sparkles,
    },
  ];
};

const getDayLabel = (date: Date) => {
  if (isToday(date)) return 'Hoje';
  if (isYesterday(date)) return 'Ontem';
  try {
    return format(date, "d 'de' MMMM 'de' yyyy", { locale: pt });
  } catch {
    return '';
  }
};

const ClientChat: React.FC<ClientChatProps> = () => {
  const { session } = useClientAuth();
  const { messages, loading, error, refetch, sendMessage, markAsRead } = useClientMessages();
  const typedMessages = messages as ClientMessage[];
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const markedRef = useRef<Set<number>>(new Set());

  const sortedMessages = useMemo(() => {
    return [...typedMessages].sort(
      (a, b) => parseISO(a.created_at).getTime() - parseISO(b.created_at).getTime()
    );
  }, [typedMessages]);

  const clientMessagesInLast24Hours = useMemo(() => {
    const twentyFourHoursAgo = subHours(new Date(), 24);
    return typedMessages.filter(msg => {
      if (msg.sender_type !== 'client') return false;
      try {
        return isAfter(parseISO(msg.created_at), twentyFourHoursAgo);
      } catch {
        return false;
      }
    }).length;
  }, [typedMessages]);

  const remainingMessages = Math.max(MESSAGE_LIMIT - clientMessagesInLast24Hours, 0);
  const isLimitReached = remainingMessages <= 0;
  const [nextAppointment, setNextAppointment] = useState<NextAppointmentInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadNextAppointment = async () => {
      if (!session?.clientId) return;
      try {
        const todayKey = format(new Date(), 'yyyy-MM-dd');
        const { data } = await supabase
          .from('agendamentos')
          .select('data, hora')
          .eq('id_cliente', session.clientId)
          .gte('data', todayKey)
          .not('estado', 'in', '("cancelado","realizado")')
          .order('data', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (!cancelled && data) {
          setNextAppointment({ data: data.data, hora: data.hora });
        }
      } catch {
        if (!cancelled) setNextAppointment(null);
      }
    };
    loadNextAppointment();
    return () => {
      cancelled = true;
    };
  }, [session?.clientId]);

  const quickReplies = useMemo(() => buildQuickReplies(nextAppointment), [nextAppointment]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [sortedMessages.length, scrollToBottom]);

  useEffect(() => {
    const unread = typedMessages.filter(
      msg => !msg.is_read && msg.sender_type === 'admin' && !markedRef.current.has(msg.id)
    );
    if (unread.length === 0) return;
    unread.forEach(msg => markedRef.current.add(msg.id));
    unread.forEach(msg => {
      markAsRead(msg.id);
    });
  }, [typedMessages, markAsRead]);

  const submitMessage = async () => {
    const messageText = newMessage.trim();

    if (!messageText || sending) return;

    if (isLimitReached) {
      toast.error(`Atingiu o limite de ${MESSAGE_LIMIT} mensagens nas últimas 24 horas. Tente novamente mais tarde.`);
      return;
    }

    setSending(true);
    setNewMessage('');
    if (inputRef.current) inputRef.current.style.height = 'auto';

    try {
      const success = await sendMessage(messageText);
      if (success) {
        toast.success('Mensagem enviada com sucesso');
      } else {
        setNewMessage(messageText);
        toast.error('Erro ao enviar a mensagem. Tente novamente.');
      }
    } catch {
      setNewMessage(messageText);
      toast.error('Erro ao enviar a mensagem. Tente novamente.');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  };

  const getMessageTime = (timestamp: string) => {
    try {
      return format(parseISO(timestamp), 'HH:mm', { locale: pt });
    } catch {
      return '—';
    }
  };

  const getMessageFullTime = (timestamp: string) => {
    try {
      return format(parseISO(timestamp), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt });
    } catch {
      return '';
    }
  };

  const getClientInitials = () => {
    const name = session?.clientName || '';
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return initials || 'Eu';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner text="A carregar mensagens" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-3 flex-wrap">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="h-8">
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  let lastDayLabel = '';

  return (
    <div className="space-y-6 min-w-0">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            Chat Privado com a Equipa
          </CardTitle>
          <CardDescription>
            Comunique diretamente com a equipa da NeuroBalance para esclarecer dúvidas ou partilhar informações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                NB
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">Equipa NeuroBalance</h3>
              <p className="text-sm text-muted-foreground">
                Disponível para responder às suas questões
              </p>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Resposta em 2-4h úteis
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center justify-between gap-2">
            <span>Mensagens</span>
            <span className="text-sm font-normal text-muted-foreground">
              {typedMessages.length} mensagem{typedMessages.length !== 1 ? 's' : ''}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 max-h-[320px] sm:max-h-[420px] min-w-0">
            {sortedMessages.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="h-10 w-10" />}
                title="Sem mensagens"
                description="Inicie a conversa enviando a primeira mensagem para a equipa."
                className="py-8"
              />
            ) : (
              sortedMessages.map((message, index) => {
                const isClient = message.sender_type === 'client';
                const messageDate = parseISO(message.created_at);
                const dayLabel = getDayLabel(messageDate);
                const showDaySeparator = dayLabel !== lastDayLabel;
                lastDayLabel = dayLabel;

                return (
                  <React.Fragment key={message.id}>
                    {showDaySeparator && (
                      <div className="flex items-center gap-3 py-2">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                          {dayLabel}
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                    )}
                    <div className={cn('flex', isClient ? 'justify-end' : 'justify-start')}>
                      <div className={cn('flex items-end gap-2 max-w-[85%] sm:max-w-md', isClient && 'flex-row-reverse')}>
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarFallback className={cn(
                            'text-[10px] font-bold',
                            isClient ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'
                          )}>
                            {isClient ? getClientInitials() : 'NB'}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          title={getMessageFullTime(message.created_at)}
                          className={cn(
                            'px-3 py-2 rounded-2xl',
                            isClient
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted text-foreground rounded-bl-sm'
                          )}
                        >
                          <p className="text-sm break-words whitespace-pre-wrap">{message.message}</p>
                          <div className={cn('flex items-center gap-1 mt-1', isClient && 'justify-end')}>
                            <span className={cn('text-[10px]', isClient ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                              {getMessageTime(message.created_at)}
                            </span>
                            {isClient && (
                              <CheckCircle className="h-3 w-3 text-primary-foreground/70" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {index === sortedMessages.length - 1 && <div ref={messagesEndRef} />}
                  </React.Fragment>
                );
              })
            )}
            {sortedMessages.length === 0 && <div ref={messagesEndRef} />}
          </div>

          <div className="border-t border-border p-3 sm:p-4">
            {!isLimitReached && quickReplies.length > 0 && (
              <div className="mb-3">
                <span className="text-xs font-medium text-muted-foreground">Respostas rápidas</span>
                <div className="flex gap-2 mt-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply.label}
                      type="button"
                      onClick={() => {
                        setNewMessage(reply.message);
                        inputRef.current?.focus();
                      }}
                      disabled={sending}
                      className="flex items-center gap-1.5 flex-shrink-0 px-3 h-8 rounded-full border border-border bg-card text-xs font-medium text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50"
                      aria-label={`Preencher mensagem: ${reply.label}`}
                    >
                      <reply.icon className="h-3.5 w-3.5" />
                      {reply.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitMessage();
              }}
              className="flex gap-2 items-end"
            >
              <Textarea
                ref={inputRef}
                value={newMessage}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={isLimitReached ? 'Limite diário de mensagens atingido' : 'Escreva a sua mensagem...'}
                disabled={sending || isLimitReached}
                rows={1}
                maxLength={MAX_LENGTH}
                className="min-h-[44px] max-h-32 resize-none text-sm sm:text-base"
                aria-label="Nova mensagem"
              />
              <Button
                type="submit"
                disabled={sending || !newMessage.trim() || isLimitReached}
                className="h-11 w-11 p-0 flex-shrink-0"
                size="sm"
                aria-label="Enviar mensagem"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            <div className="flex justify-between items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">
                {newMessage.length}/{MAX_LENGTH} caracteres
              </span>
              {isLimitReached ? (
                <span className="text-xs text-destructive font-semibold">
                  Limite diário atingido
                </span>
              ) : (
                <span className="text-xs font-medium text-primary">
                  Pode enviar mais {remainingMessages} {remainingMessages === 1 ? 'mensagem' : 'mensagens'} hoje
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Contactos Alternativos
          </CardTitle>
          <CardDescription>
            Outras formas de entrar em contacto connosco
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Phone className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">Telefone</p>
                <p className="text-sm text-muted-foreground">+351 924 853 554</p>
                <p className="text-xs text-muted-foreground">Horário: 9h às 18h (dias úteis)</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">Email</p>
                <a
                  href="mailto:geral.neurobalance@gmail.com"
                  className="text-sm text-primary hover:underline block break-words"
                >
                  geral.neurobalance@gmail.com
                </a>
                <p className="text-xs text-muted-foreground">Resposta em até 24 horas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Diretrizes do Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <p>Use este chat para dúvidas sobre tratamentos, agendamentos e questões administrativas, com um máximo de 5 mensagens por dia</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <p>A nossa equipa responde normalmente em 2-4 horas durante o horário comercial</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p>Para emergências médicas, contacte diretamente o seu médico ou os serviços de emergência</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p>Mantenha as mensagens respeitosas e relacionadas com o seu tratamento</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientChat;
