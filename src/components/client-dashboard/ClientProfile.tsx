import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Info
} from 'lucide-react';
import { format, parseISO, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientProfileProps {
  clientData: any;
}

const ClientProfile: React.FC<ClientProfileProps> = ({ clientData }) => {
  const getInitials = (name: string) => {
    return name
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'thinking': return 'bg-yellow-100 text-yellow-800';
      case 'no-need': return 'bg-gray-100 text-gray-800';
      case 'finished': return 'bg-blue-100 text-blue-800';
      case 'call': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const progressPercentage = clientData.max_sessoes > 0 ? 
    Math.round((clientData.numero_sessoes / clientData.max_sessoes) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Informações Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>
            Seus dados pessoais registrados na clínica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-[#3f9094] text-white text-xl">
                {getInitials(clientData.nome)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{clientData.nome}</h2>
                <div className="flex items-center gap-2 mt-1">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{clientData.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{clientData.telefone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{clientData.morada}</span>
                </div>
                {clientData.data_nascimento && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(parseISO(clientData.data_nascimento), 'dd/MM/yyyy', { locale: ptBR })}
                      {getAge(clientData.data_nascimento) && (
                        <span className="text-sm text-gray-500 ml-1">
                          ({getAge(clientData.data_nascimento)} anos)
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {clientData.genero && (
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span>Género: {clientData.genero}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas do Tratamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Estatísticas do Tratamento
          </CardTitle>
          <CardDescription>
            Resumo do seu progresso e tratamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#3f9094]">
                {clientData.numero_sessoes || 0}
              </div>
              <div className="text-sm text-gray-600">Sessões Realizadas</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-[#3f9094]">
                {clientData.max_sessoes || 0}
              </div>
              <div className="text-sm text-gray-600">Sessões Planejadas</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-[#3f9094]">
                {progressPercentage}%
              </div>
              <div className="text-sm text-gray-600">Progresso</div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progresso do Tratamento</span>
              <span className="text-sm text-gray-600">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#3f9094] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-2 text-gray-600">
              <TrendingUp className="h-4 w-4" />
              <span>Total Investido: €{clientData.total_pago || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                Cliente desde: {format(parseISO(clientData.criado_em), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Próxima Sessão */}
      {clientData.proxima_sessao && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próxima Sessão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-blue-900">
                  {clientData.proxima_sessao_titulo || 'Sessão Agendada'}
                </h3>
                <p className="text-blue-700">
                  {format(parseISO(clientData.proxima_sessao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
                {clientData.proxima_sessao_tipo && (
                  <p className="text-sm text-blue-600">
                    Tipo: {clientData.proxima_sessao_tipo}
                  </p>
                )}
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                {clientData.proxima_sessao_estado || 'Agendado'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observações */}
      {clientData.notas && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">{clientData.notas}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações de Privacidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacidade e Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Seus dados pessoais são protegidos de acordo com o RGPD</p>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Apenas você e a equipa médica têm acesso às suas informações</p>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Todas as comunicações são criptografadas e seguras</p>
            </div>
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p>
                Para alterações nos seus dados, entre em contacto com a clínica através do chat ou telefone
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientProfile; 