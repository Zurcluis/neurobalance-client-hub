import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  TrendingUp, 
  Calendar, 
  Download,
  Eye,
  BarChart3,
  Activity,
  Brain,
  Target,
  Award,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientReportsProps {
  clientId: number;
}

const ClientReports: React.FC<ClientReportsProps> = ({ clientId }) => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // Dados simulados de relatórios (em produção, viriam do Supabase)
  const reports = [
    {
      id: '1',
      title: 'Avaliação Inicial',
      type: 'assessment',
      date: '2024-01-15',
      status: 'completed',
      summary: 'Avaliação neuropsicológica inicial completa com identificação de padrões de atividade cerebral.',
      details: {
        score: 85,
        areas: ['Atenção', 'Concentração', 'Memória de Trabalho'],
        recommendations: ['Sessões de Neurofeedback', 'Exercícios de mindfulness', 'Rotina de sono regular']
      }
    },
    {
      id: '2',
      title: 'Progresso - 1º Mês',
      type: 'progress',
      date: '2024-02-15',
      status: 'completed',
      summary: 'Avaliação de progresso após 8 sessões de neurofeedback.',
      details: {
        score: 92,
        improvement: 8.2,
        areas: ['Melhoria na concentração', 'Redução da ansiedade', 'Melhor qualidade do sono'],
        nextSteps: ['Continuar protocolo atual', 'Adicionar exercícios de respiração']
      }
    },
    {
      id: '3',
      title: 'Relatório Intermédio',
      type: 'intermediate',
      date: '2024-03-15',
      status: 'completed',
      summary: 'Avaliação detalhada após 16 sessões com análise comparativa.',
      details: {
        score: 96,
        improvement: 12.9,
        areas: ['Excelente progresso em todas as áreas', 'Estabilização dos padrões cerebrais'],
        achievements: ['Meta de concentração atingida', 'Redução significativa da ansiedade']
      }
    },
    {
      id: '4',
      title: 'Relatório Final',
      type: 'final',
      date: '2024-04-15',
      status: 'pending',
      summary: 'Relatório final do tratamento com recomendações de manutenção.',
      details: null
    }
  ];

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'assessment': return 'bg-blue-100 text-blue-800';
      case 'progress': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-purple-100 text-purple-800';
      case 'final': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'assessment': return 'Avaliação';
      case 'progress': return 'Progresso';
      case 'intermediate': return 'Intermédio';
      case 'final': return 'Final';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Progresso';
      default: return status;
    }
  };

  const completedReports = reports.filter(r => r.status === 'completed');
  const progressData = completedReports.map(r => ({
    date: r.date,
    score: r.details?.score || 0,
    improvement: r.details?.improvement || 0
  }));

  return (
    <div className="space-y-6">
      {/* Resumo do Progresso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resumo do Progresso
          </CardTitle>
          <CardDescription>
            Visão geral da sua evolução ao longo do tratamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#3f9094]">
                {completedReports.length}
              </div>
              <div className="text-sm text-gray-600">Relatórios Concluídos</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-[#3f9094]">
                {progressData.length > 0 ? progressData[progressData.length - 1].score : 0}
              </div>
              <div className="text-sm text-gray-600">Pontuação Atual</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-[#3f9094]">
                {progressData.length > 0 ? 
                  `+${progressData[progressData.length - 1].improvement?.toFixed(1)}%` : 
                  '0%'
                }
              </div>
              <div className="text-sm text-gray-600">Melhoria Total</div>
            </div>
          </div>

          {/* Gráfico de Progresso Simples */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-4">Evolução da Pontuação</h3>
            <div className="flex items-end justify-between h-32">
              {progressData.map((data, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className="bg-[#3f9094] rounded-t-md w-8 transition-all duration-300"
                    style={{ height: `${(data.score / 100) * 100}%` }}
                  />
                  <div className="text-xs text-gray-600 mt-2">
                    {format(new Date(data.date), 'MMM', { locale: ptBR })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Relatórios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatórios Disponíveis
          </CardTitle>
          <CardDescription>
            Acesse seus relatórios de avaliação e progresso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{report.title}</h3>
                      <Badge className={getReportTypeColor(report.type)}>
                        {getReportTypeLabel(report.type)}
                      </Badge>
                      <Badge className={getStatusColor(report.status)}>
                        {getStatusLabel(report.status)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{report.summary}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(report.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </div>
                      {report.details?.score && (
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4" />
                          <span>Pontuação: {report.details.score}</span>
                        </div>
                      )}
                    </div>

                    {/* Detalhes do Relatório */}
                    {report.details && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {report.details.areas && (
                            <div>
                              <h4 className="font-medium text-blue-900 mb-1">Áreas Avaliadas:</h4>
                              <ul className="text-blue-800 space-y-1">
                                {report.details.areas.map((area, index) => (
                                  <li key={index} className="flex items-center gap-1">
                                    <Target className="h-3 w-3" />
                                    {area}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {report.details.recommendations && (
                            <div>
                              <h4 className="font-medium text-blue-900 mb-1">Recomendações:</h4>
                              <ul className="text-blue-800 space-y-1">
                                {report.details.recommendations.map((rec, index) => (
                                  <li key={index} className="flex items-center gap-1">
                                    <Brain className="h-3 w-3" />
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {report.details.achievements && (
                            <div>
                              <h4 className="font-medium text-blue-900 mb-1">Conquistas:</h4>
                              <ul className="text-blue-800 space-y-1">
                                {report.details.achievements.map((achievement, index) => (
                                  <li key={index} className="flex items-center gap-1">
                                    <Award className="h-3 w-3" />
                                    {achievement}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-2 ml-4">
                    {report.status === 'completed' && (
                      <>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </>
                    )}
                    {report.status === 'pending' && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        Em Preparação
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métricas de Desempenho */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Métricas de Desempenho
          </CardTitle>
          <CardDescription>
            Indicadores chave do seu progresso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Concentração</span>
                <span className="text-sm text-gray-600">92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Controlo de Ansiedade</span>
                <span className="text-sm text-gray-600">88%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '88%' }} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Qualidade do Sono</span>
                <span className="text-sm text-gray-600">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Memória de Trabalho</span>
                <span className="text-sm text-gray-600">90%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '90%' }} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Regulação Emocional</span>
                <span className="text-sm text-gray-600">87%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-pink-500 h-2 rounded-full" style={{ width: '87%' }} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Bem-estar Geral</span>
                <span className="text-sm text-gray-600">91%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-[#3f9094] h-2 rounded-full" style={{ width: '91%' }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Importantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Sobre os Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p>Os relatórios são gerados automaticamente após cada avaliação</p>
            </div>
            <div className="flex items-start gap-2">
              <Download className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Pode descarregar os relatórios em formato PDF para os seus registos</p>
            </div>
            <div className="flex items-start gap-2">
              <Brain className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <p>Cada relatório inclui análise detalhada e recomendações personalizadas</p>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <p>O progresso é medido através de métricas objetivas e validadas cientificamente</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientReports; 