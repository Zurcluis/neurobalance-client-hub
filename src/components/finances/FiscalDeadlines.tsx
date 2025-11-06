import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, AlertCircle, CheckCircle2, Clock, Bell, Filter } from 'lucide-react';
import { format, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface FiscalDeadlinesProps {
  year?: number;
}

interface Deadline {
  id: string;
  title: string;
  description: string;
  date: Date;
  type: 'iva' | 'irs' | 'ss' | 'outros';
  priority: 'high' | 'medium' | 'low';
  recurrent: boolean;
}

const getIVADeadlines = (year: number): Deadline[] => {
  return [
    {
      id: 'iva-t1',
      title: 'IVA 1º Trimestre',
      description: 'Declaração periódica de IVA referente ao 1º trimestre',
      date: new Date(year, 4, 15),
      type: 'iva',
      priority: 'high',
      recurrent: true
    },
    {
      id: 'iva-t2',
      title: 'IVA 2º Trimestre',
      description: 'Declaração periódica de IVA referente ao 2º trimestre',
      date: new Date(year, 7, 15),
      type: 'iva',
      priority: 'high',
      recurrent: true
    },
    {
      id: 'iva-t3',
      title: 'IVA 3º Trimestre',
      description: 'Declaração periódica de IVA referente ao 3º trimestre',
      date: new Date(year, 10, 15),
      type: 'iva',
      priority: 'high',
      recurrent: true
    },
    {
      id: 'iva-t4',
      title: 'IVA 4º Trimestre',
      description: 'Declaração periódica de IVA referente ao 4º trimestre do ano anterior',
      date: new Date(year, 1, 15),
      type: 'iva',
      priority: 'high',
      recurrent: true
    }
  ];
};

const getIRSDeadlines = (year: number): Deadline[] => {
  return [
    {
      id: 'irs-declaracao',
      title: 'Declaração IRS (Modelo 3)',
      description: 'Entrega da declaração de rendimentos do ano anterior',
      date: new Date(year, 5, 30),
      type: 'irs',
      priority: 'high',
      recurrent: true
    },
    {
      id: 'irs-pagamento-1',
      title: 'IRS - 1ª Prestação (Pagamento por Conta)',
      description: 'Pagamento da 1ª prestação do IRS (22,67% do imposto do ano anterior)',
      date: new Date(year, 6, 31),
      type: 'irs',
      priority: 'high',
      recurrent: true
    },
    {
      id: 'irs-pagamento-2',
      title: 'IRS - 2ª Prestação (Pagamento por Conta)',
      description: 'Pagamento da 2ª prestação do IRS (22,67% do imposto do ano anterior)',
      date: new Date(year, 8, 30),
      type: 'irs',
      priority: 'high',
      recurrent: true
    },
    {
      id: 'irs-pagamento-3',
      title: 'IRS - 3ª Prestação (Pagamento por Conta)',
      description: 'Pagamento da 3ª prestação do IRS (22,67% do imposto do ano anterior)',
      date: new Date(year, 11, 31),
      type: 'irs',
      priority: 'high',
      recurrent: true
    }
  ];
};

const getSSDeadlines = (year: number): Deadline[] => {
  const deadlines: Deadline[] = [];
  for (let month = 0; month < 12; month++) {
    deadlines.push({
      id: `ss-${month + 1}`,
      title: `Segurança Social - ${format(new Date(year, month), 'MMMM', { locale: ptBR })}`,
      description: `Pagamento das contribuições à Segurança Social`,
      date: new Date(year, month, 20),
      type: 'ss',
      priority: 'high',
      recurrent: true
    });
  }
  return deadlines;
};

const getOtherDeadlines = (year: number): Deadline[] => {
  return [
    {
      id: 'dmr',
      title: 'Declaração Mensal de Remunerações',
      description: 'Entrega da DMR (se aplicável)',
      date: new Date(year, 0, 10),
      type: 'outros',
      priority: 'medium',
      recurrent: true
    },
    {
      id: 'ies',
      title: 'IES (Informação Empresarial Simplificada)',
      description: 'Entrega da declaração anual de informação contabilística e fiscal',
      date: new Date(year, 6, 15),
      type: 'outros',
      priority: 'medium',
      recurrent: true
    },
    {
      id: 'modelo-10',
      title: 'Modelo 10 - Retenções na Fonte',
      description: 'Declaração de retenções na fonte (mensal)',
      date: new Date(year, 0, 20),
      type: 'outros',
      priority: 'medium',
      recurrent: true
    }
  ];
};

export const FiscalDeadlines: React.FC<FiscalDeadlinesProps> = ({ year = new Date().getFullYear() }) => {
  const [selectedYear, setSelectedYear] = useState<number>(year);
  const [filterType, setFilterType] = useState<'all' | 'iva' | 'irs' | 'ss' | 'outros'>('all');

  const allDeadlines = useMemo(() => {
    return [
      ...getIVADeadlines(selectedYear),
      ...getIRSDeadlines(selectedYear),
      ...getSSDeadlines(selectedYear),
      ...getOtherDeadlines(selectedYear)
    ].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [selectedYear]);

  const categorizedDeadlines = useMemo(() => {
    const today = new Date();
    const in7Days = addDays(today, 7);
    const in30Days = addDays(today, 30);

    const overdue = allDeadlines.filter(d => isBefore(d.date, today));
    const urgent = allDeadlines.filter(d => 
      (isAfter(d.date, today) || d.date.getTime() === today.getTime()) && 
      isBefore(d.date, in7Days)
    );
    const upcoming = allDeadlines.filter(d => 
      (isAfter(d.date, in7Days) || d.date.getTime() === in7Days.getTime()) && 
      isBefore(d.date, in30Days)
    );
    const later = allDeadlines.filter(d => 
      isAfter(d.date, in30Days) || d.date.getTime() === in30Days.getTime()
    );

    return { overdue, urgent, upcoming, later, all: allDeadlines };
  }, [allDeadlines]);

  const filteredDeadlines = useMemo(() => {
    if (filterType === 'all') return categorizedDeadlines;
    
    return {
      overdue: categorizedDeadlines.overdue.filter(d => d.type === filterType),
      urgent: categorizedDeadlines.urgent.filter(d => d.type === filterType),
      upcoming: categorizedDeadlines.upcoming.filter(d => d.type === filterType),
      later: categorizedDeadlines.later.filter(d => d.type === filterType),
      all: categorizedDeadlines.all.filter(d => d.type === filterType)
    };
  }, [categorizedDeadlines, filterType]);

  const handleSetReminder = (deadline: Deadline) => {
    toast.success(`Lembrete configurado para ${deadline.title}`);
  };

  const getDeadlineStatus = (date: Date) => {
    const today = new Date();
    const daysUntil = differenceInDays(date, today);

    if (daysUntil < 0) return { status: 'overdue', color: 'red', text: 'Vencido' };
    if (daysUntil <= 7) return { status: 'urgent', color: 'orange', text: 'Urgente' };
    if (daysUntil <= 30) return { status: 'upcoming', color: 'yellow', text: 'Próximo' };
    return { status: 'ok', color: 'green', text: 'OK' };
  };

  const DeadlineCard: React.FC<{ deadline: Deadline }> = ({ deadline }) => {
    const status = getDeadlineStatus(deadline.date);
    const today = new Date();
    const daysUntil = differenceInDays(deadline.date, today);

    return (
      <div 
        className={`p-4 rounded-lg border-l-4 ${
          status.status === 'overdue' ? 'bg-red-50 border-l-red-500' :
          status.status === 'urgent' ? 'bg-orange-50 border-l-orange-500' :
          status.status === 'upcoming' ? 'bg-yellow-50 border-l-yellow-500' :
          'bg-white border-l-green-500'
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {status.status === 'overdue' ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : status.status === 'urgent' ? (
                <Clock className="h-5 w-5 text-orange-600" />
              ) : (
                <Calendar className="h-5 w-5 text-green-600" />
              )}
              <h3 className="font-semibold">{deadline.title}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">{deadline.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className={`font-medium ${
                status.status === 'overdue' ? 'text-red-600' : 'text-gray-700'
              }`}>
                {format(deadline.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                status.status === 'overdue' ? 'bg-red-100 text-red-700' :
                status.status === 'urgent' ? 'bg-orange-100 text-orange-700' :
                status.status === 'upcoming' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {status.status === 'overdue' 
                  ? `${Math.abs(daysUntil)} dias em atraso`
                  : daysUntil === 0
                  ? 'Hoje'
                  : daysUntil === 1
                  ? 'Amanhã'
                  : `${daysUntil} dias`
                }
              </span>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => handleSetReminder(deadline)}
            className="ml-4"
          >
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ano</label>
            <select
              className="border rounded px-3 py-2 bg-white"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i - 1).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            className="border rounded px-3 py-2 bg-white text-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="all">Todos</option>
            <option value="iva">IVA</option>
            <option value="irs">IRS</option>
            <option value="ss">Segurança Social</option>
            <option value="outros">Outros</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {filteredDeadlines.overdue.length}
            </div>
            <p className="text-xs text-red-700 mt-1">Obrigações em atraso</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {filteredDeadlines.urgent.length}
            </div>
            <p className="text-xs text-orange-700 mt-1">Próximos 7 dias</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {filteredDeadlines.upcoming.length}
            </div>
            <p className="text-xs text-yellow-700 mt-1">Próximos 30 dias</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {filteredDeadlines.all.length}
            </div>
            <p className="text-xs text-green-700 mt-1">Obrigações em {selectedYear}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-6 mt-6">
          {filteredDeadlines.overdue.length > 0 && (
            <Card className="bg-gradient-to-br from-red-50 to-white border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Obrigações Vencidas ({filteredDeadlines.overdue.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredDeadlines.overdue.map(deadline => (
                  <DeadlineCard key={deadline.id} deadline={deadline} />
                ))}
              </CardContent>
            </Card>
          )}

          {filteredDeadlines.urgent.length > 0 && (
            <Card className="bg-gradient-to-br from-orange-50 to-white border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="text-orange-800 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Urgentes - Próximos 7 Dias ({filteredDeadlines.urgent.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredDeadlines.urgent.map(deadline => (
                  <DeadlineCard key={deadline.id} deadline={deadline} />
                ))}
              </CardContent>
            </Card>
          )}

          {filteredDeadlines.upcoming.length > 0 && (
            <Card className="bg-gradient-to-br from-yellow-50 to-white border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="text-yellow-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Próximos 30 Dias ({filteredDeadlines.upcoming.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredDeadlines.upcoming.map(deadline => (
                  <DeadlineCard key={deadline.id} deadline={deadline} />
                ))}
              </CardContent>
            </Card>
          )}

          {filteredDeadlines.later.length > 0 && (
            <Card className="bg-gradient-to-br from-white to-gray-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Mais Tarde ({filteredDeadlines.later.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredDeadlines.later.map(deadline => (
                  <DeadlineCard key={deadline.id} deadline={deadline} />
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendário de Obrigações Fiscais {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i;
                  const monthName = format(new Date(selectedYear, month), 'MMMM', { locale: ptBR });
                  const monthDeadlines = filteredDeadlines.all.filter(d => d.date.getMonth() === month);

                  return (
                    <div key={month} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3 capitalize text-center bg-[#3f9094] text-white py-2 rounded">
                        {monthName}
                      </h3>
                      <div className="space-y-2">
                        {monthDeadlines.length > 0 ? (
                          monthDeadlines.map(deadline => {
                            const status = getDeadlineStatus(deadline.date);
                            return (
                              <div 
                                key={deadline.id}
                                className={`text-xs p-2 rounded border-l-2 ${
                                  status.status === 'overdue' ? 'bg-red-50 border-l-red-500' :
                                  status.status === 'urgent' ? 'bg-orange-50 border-l-orange-500' :
                                  status.status === 'upcoming' ? 'bg-yellow-50 border-l-yellow-500' :
                                  'bg-green-50 border-l-green-500'
                                }`}
                              >
                                <p className="font-medium">{deadline.title}</p>
                                <p className="text-gray-600">Dia {deadline.date.getDate()}</p>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-gray-400 text-center py-4">Sem obrigações</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FiscalDeadlines;

