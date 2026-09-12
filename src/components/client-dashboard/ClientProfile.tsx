import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  Clock,
  TrendingUp,
  Shield,
  Info,
  MessageSquare
} from 'lucide-react';
import { format, parseISO, differenceInYears } from 'date-fns';
import { pt } from 'date-fns/locale';
import type { ClientRecord } from '@/components/client-dashboard/types';

interface ClientProfileProps {
  clientData: ClientRecord;
  onOpenChat?: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ongoing': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
    case 'thinking': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
    case 'no-need': return 'bg-muted text-foreground';
    case 'finished': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
    case 'call': return 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300';
    default: return 'bg-muted text-foreground';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'ongoing': return 'Em Tratamento';
    case 'thinking': return 'Em Avaliação';
    case 'no-need': return 'Sem Necessidade';
    case 'finished': return 'Tratamento Concluído';
    case 'call': return 'Contactar';
    default: return status;
  }
};

const getInitials = (name: string) => {
  return (name || '')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getAge = (birthDate: string) => {
  try {
    return differenceInYears(new Date(), parseISO(birthDate));
  } catch {
    return null;
  }
};

const ClientProfile: React.FC<ClientProfileProps> = ({ clientData, onOpenChat }) => {
  const maxSessoes = clientData.max_sessoes ?? 0;
  const progressPercentage = maxSessoes > 0
    ? Math.round(((clientData.numero_sessoes || 0) / maxSessoes) * 100)
    : 0;

  return (
    <div className="space-y-6 min-w-0">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            Informações Pessoais
          </CardTitle>
          <CardDescription>
            Os seus dados pessoais registados na clínica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start gap-6 min-w-0">
            <Avatar className="h-20 w-20 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {getInitials(clientData.nome)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4 min-w-0">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{clientData.nome}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge className={getStatusColor(clientData.estado)}>
                    {getStatusLabel(clientData.estado)}
                  </Badge>
                  {clientData.id_manual && (
                    <Badge variant="outline">
                      ID: {clientData.id_manual}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{clientData.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>{clientData.telefone || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{clientData.morada || '—'}</span>
                </div>
                {clientData.data_nascimento && (
                  <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>
                      {format(parseISO(clientData.data_nascimento), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                      {getAge(clientData.data_nascimento) !== null && (
                        <span className="text-sm text-muted-foreground ml-1">
                          ({getAge(clientData.data_nascimento)} anos)
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {clientData.genero && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span>Género: {clientData.genero}</span>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={onOpenChat}
                className="mt-2 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Sugerir alterações aos seus dados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            Estatísticas do Tratamento
          </CardTitle>
          <CardDescription>
            Resumo do seu progresso e tratamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">
                {clientData.numero_sessoes || 0}
              </div>
              <div className="text-sm text-muted-foreground">Sessões Realizadas</div>
            </div>

            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">
                {clientData.max_sessoes || 0}
              </div>
              <div className="text-sm text-muted-foreground">Sessões Planeadas</div>
            </div>

            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">
                {progressPercentage}%
              </div>
              <div className="text-sm text-muted-foreground">Progresso</div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Progresso do Tratamento</span>
              <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4 flex-shrink-0" />
              <span>Total Pago: €{clientData.total_pago || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>
                Cliente desde:{' '}
                {clientData.criado_em
                  ? format(parseISO(clientData.criado_em), "d 'de' MMMM 'de' yyyy", { locale: pt })
                  : '—'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {clientData.proxima_sessao && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Próxima Sessão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground">
                  {clientData.proxima_sessao_titulo || 'Sessão Agendada'}
                </h3>
                <p className="text-primary">
                  {format(parseISO(clientData.proxima_sessao), "d 'de' MMMM 'às' HH:mm", { locale: pt })}
                </p>
                {clientData.proxima_sessao_tipo && (
                  <p className="text-sm text-muted-foreground">
                    Tipo: {clientData.proxima_sessao_tipo}
                  </p>
                )}
              </div>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-0 self-start sm:self-auto">
                {clientData.proxima_sessao_estado || 'Agendado'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {clientData.notas && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-foreground/80">{clientData.notas}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Privacidade e Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <p>Os seus dados pessoais são protegidos de acordo com o RGPD</p>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <p>Apenas você e a equipa da NeuroBalance têm acesso às suas informações</p>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <p>Todas as comunicações são encriptadas e seguras</p>
            </div>
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p>
                Para alterações nos seus dados, contacte a clínica através do chat ou telefone
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientProfile;
