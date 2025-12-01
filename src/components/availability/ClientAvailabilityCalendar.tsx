import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Plus, X, CheckCircle, CalendarCheck } from 'lucide-react';
import { useClientAvailability } from '@/hooks/useClientAvailability';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AvailabilityForm } from './AvailabilityForm';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { ClientAvailability } from '@/types/availability';
import { getAllHolidaysUntil2040 } from '@/data/portugueseHolidays';

// Interface para agendamentos do cliente
interface ClientAppointment {
  id: number;
  titulo: string;
  data: string;
  hora: string;
  estado: string;
  tipo: string;
  terapeuta?: string;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_SEMANA_MOBILE = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

interface ClientAvailabilityCalendarProps {
  clienteId: number;
}

export const ClientAvailabilityCalendar: React.FC<ClientAvailabilityCalendarProps> = ({ clienteId }) => {
  const { availabilities, isLoading, deleteAvailability } = useClientAvailability(clienteId);
  const isMobile = useIsMobile();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<ClientAvailability | null>(null);
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  
  const holidays = getAllHolidaysUntil2040();

  // Buscar agendamentos do cliente
  const fetchAppointments = useCallback(async () => {
    if (!clienteId) return;
    
    try {
      setLoadingAppointments(true);
      const { data, error } = await supabase
        .from('agendamentos')
        .select('id, titulo, data, hora, estado, tipo, terapeuta')
        .eq('id_cliente', clienteId)
        .order('data', { ascending: true });
      
      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setLoadingAppointments(false);
    }
  }, [clienteId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Obter agendamentos para um dia específico
  const getAppointmentsForDay = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return appointments.filter((apt) => {
      const aptDate = apt.data.split('T')[0];
      return aptDate === dateString;
    });
  };

  // Verificar se o dia tem sessões agendadas
  const hasScheduledSessions = (date: Date) => {
    const dayAppointments = getAppointmentsForDay(date);
    return dayAppointments.some(apt => ['pendente', 'confirmado', 'agendado'].includes(apt.estado));
  };

  // Verificar se o dia tem sessões realizadas
  const hasCompletedSessions = (date: Date) => {
    const dayAppointments = getAppointmentsForDay(date);
    return dayAppointments.some(apt => apt.estado === 'realizado');
  };
  
  const getHolidayForDay = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return holidays.find((holiday) => holiday.date === dateString);
  };

  // =====================================================
  // CALENDAR DAYS
  // =====================================================

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // =====================================================
  // GET AVAILABILITIES FOR DAY
  // =====================================================

  const getAvailabilitiesForDay = (date: Date) => {
    const dayOfWeek = date.getDay();
    const dateString = format(date, 'yyyy-MM-dd');
    
    return availabilities.filter((avail) => {
      if (avail.status !== 'ativo') return false;
      
      if (avail.recorrencia === 'diaria') {
        return avail.valido_de === dateString;
      }
      
      return avail.dia_semana === dayOfWeek;
    });
  };

  // =====================================================
  // HAS AVAILABILITIES
  // =====================================================

  const hasAvailabilities = (date: Date) => {
    return getAvailabilitiesForDay(date).length > 0;
  };

  // =====================================================
  // HANDLE DAY CLICK
  // =====================================================

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setEditingAvailability(null);
    setIsDialogOpen(true);
  };

  // =====================================================
  // HANDLE EDIT AVAILABILITY
  // =====================================================

  const handleEditAvailability = (availability: ClientAvailability) => {
    setEditingAvailability(availability);
    setIsDialogOpen(true);
  };

  // =====================================================
  // HANDLE DELETE AVAILABILITY
  // =====================================================

  const handleDeleteAvailability = async (id: string) => {
    await deleteAvailability(id);
  };

  // =====================================================
  // NAVIGATE MONTH
  // =====================================================

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  // =====================================================
  // RENDER DAY CELL
  // =====================================================

  const renderDayCell = (date: Date) => {
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isToday = isSameDay(date, new Date());
    const hasAvail = hasAvailabilities(date);
    const availCount = getAvailabilitiesForDay(date).length;
    const holiday = getHolidayForDay(date);
    const hasScheduled = hasScheduledSessions(date);
    const hasCompleted = hasCompletedSessions(date);
    const dayAppointments = getAppointmentsForDay(date);

    return (
      <button
        key={date.toString()}
        onClick={() => handleDayClick(date)}
        disabled={!isCurrentMonth}
        className={cn(
          'relative w-full text-center transition-all duration-200 rounded-xl group',
          isMobile ? 'h-11 min-h-[44px]' : 'h-16 sm:h-20',
          'hover:scale-105 hover:z-10',
          'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100',
          isCurrentMonth && !isToday && !hasAvail && !holiday && !hasScheduled && !hasCompleted && 'hover:bg-gray-100',
          isToday && 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/30',
          hasScheduled && !isToday && !hasCompleted && 'bg-gradient-to-br from-teal-50 to-cyan-50 ring-1 ring-teal-300',
          hasCompleted && !isToday && 'bg-gradient-to-br from-green-50 to-emerald-50 ring-1 ring-green-300',
          hasAvail && !isToday && !hasScheduled && !hasCompleted && 'bg-gradient-to-br from-emerald-50 to-teal-50 ring-1 ring-emerald-200',
          holiday && holiday.type === 'feriado' && !isToday && !hasScheduled && !hasCompleted && 'bg-gradient-to-br from-rose-50 to-pink-50 ring-1 ring-rose-200',
          holiday && holiday.type === 'feriado_municipal' && !isToday && !hasScheduled && !hasCompleted && 'bg-gradient-to-br from-orange-50 to-amber-50 ring-1 ring-orange-200',
          holiday && holiday.type === 'dia_importante' && !isToday && !hasScheduled && !hasCompleted && 'bg-gradient-to-br from-violet-50 to-purple-50 ring-1 ring-violet-200'
        )}
        title={holiday ? holiday.name : (hasScheduled ? 'Sessão agendada' : (hasCompleted ? 'Sessão realizada' : undefined))}
      >
        <div className="flex flex-col items-center justify-center h-full gap-0.5">
          <span className={cn(
            isMobile ? 'text-sm' : 'text-base',
            'font-semibold transition-colors',
            isToday ? 'text-white' : 'text-gray-700',
            !isCurrentMonth && 'text-gray-300'
          )}>
            {format(date, 'd')}
          </span>
          
          {/* Indicadores de sessão (prioridade sobre feriados e disponibilidades) */}
          {(hasScheduled || hasCompleted) && !isToday && (
            isMobile ? (
              <div className="flex gap-0.5">
                {hasScheduled && <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
                {hasCompleted && <div className="w-1.5 h-1.5 rounded-full bg-green-600" />}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {hasScheduled && (
                  <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-teal-500 text-white flex items-center gap-0.5">
                    <CalendarCheck className="w-2.5 h-2.5" />
                    {dayAppointments.filter(apt => ['pendente', 'confirmado', 'agendado'].includes(apt.estado)).length}
                  </span>
                )}
                {hasCompleted && (
                  <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-green-600 text-white flex items-center gap-0.5">
                    <CheckCircle className="w-2.5 h-2.5" />
                    {dayAppointments.filter(apt => apt.estado === 'realizado').length}
                  </span>
                )}
              </div>
            )
          )}
          
          {/* Feriados (quando não há sessões) */}
          {holiday && !isToday && !hasScheduled && !hasCompleted && (
            isMobile ? (
              <div className={cn(
                'w-1.5 h-1.5 rounded-full',
                holiday.type === 'feriado' && 'bg-rose-500',
                holiday.type === 'feriado_municipal' && 'bg-orange-500',
                holiday.type === 'dia_importante' && 'bg-violet-500',
                (holiday.type === 'tradicao' || holiday.type === 'cultural' || holiday.type === 'religioso') && 'bg-amber-500'
              )} />
            ) : (
              <span className={cn(
                'text-[10px] font-medium leading-tight truncate max-w-full px-1',
                holiday.type === 'feriado' && 'text-rose-600',
                holiday.type === 'feriado_municipal' && 'text-orange-600',
                holiday.type === 'dia_importante' && 'text-violet-600',
                (holiday.type === 'tradicao' || holiday.type === 'cultural' || holiday.type === 'religioso') && 'text-amber-600'
              )}>
                {holiday.name.length > 8 ? holiday.name.substring(0, 7) + '…' : holiday.name}
              </span>
            )
          )}
          
          {/* Disponibilidades (quando não há sessões nem feriados) */}
          {hasAvail && !holiday && !hasScheduled && !hasCompleted && (
            isMobile ? (
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            ) : (
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                isToday 
                  ? "bg-white/30 text-white" 
                  : "bg-emerald-500 text-white"
              )}>
                {availCount}
              </span>
            )
          )}
          {isToday && (
            <span className="text-[9px] font-medium text-white/80 uppercase tracking-wider">
              {isMobile ? '' : 'Hoje'}
            </span>
          )}
        </div>
      </button>
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 animate-pulse">
          <div className="h-6 w-64 bg-gray-200 rounded-lg" />
        </div>
        <div className="p-5">
          <div className="grid grid-cols-7 gap-2">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Minha Disponibilidade</h3>
                <p className="text-xs text-gray-500">Gerencie seus horários disponíveis</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToToday} 
              className="h-9 px-4 rounded-xl font-medium hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-colors"
            >
              Hoje
            </Button>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={previousMonth} 
              className="h-10 w-10 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <h3 className="text-lg font-bold text-gray-900 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h3>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={nextMonth} 
              className="h-10 w-10 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="bg-gray-50/50 rounded-xl p-2 sm:p-3">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {(isMobile ? DIAS_SEMANA_MOBILE : DIAS_SEMANA).map((day, idx) => (
                <div key={idx} className={cn(
                  "text-center font-semibold text-gray-500 py-2",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date) => renderDayCell(date))}
            </div>
          </div>

          {/* Legend */}
          <div className={cn(
            "flex items-center justify-center text-gray-500 py-2 flex-wrap",
            isMobile ? "text-[10px] gap-1.5" : "text-sm gap-3"
          )}>
            {[
              { color: 'bg-blue-500', label: 'Hoje', mobileLabel: 'Hoje' },
              { color: 'bg-emerald-500', label: 'Disponível', mobileLabel: 'Disp' },
              { color: 'bg-teal-500', label: 'Agendado', mobileLabel: 'Agend' },
              { color: 'bg-green-600', label: 'Realizado', mobileLabel: 'Real' },
              { color: 'bg-rose-500', label: 'Feriado', mobileLabel: 'Fer' },
              { color: 'bg-orange-500', label: 'Municipal', mobileLabel: 'Mun' },
              { color: 'bg-violet-500', label: 'Especial', mobileLabel: 'Esp' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <div className={cn("rounded-full", item.color, isMobile ? "w-2 h-2" : "w-2.5 h-2.5")} />
                <span className="font-medium whitespace-nowrap">{isMobile ? item.mobileLabel : item.label}</span>
              </div>
            ))}
          </div>

          {/* Selected Day Details */}
          {selectedDate && (
            <div className="mt-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-100">
              <div className="mb-3">
                <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </h4>
                {getHolidayForDay(selectedDate) && (
                  <div className="mt-2 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
                    <p className="text-sm font-semibold text-amber-800">
                      🎉 {getHolidayForDay(selectedDate)?.name}
                    </p>
                  </div>
                )}
              </div>

              {/* Sessões do dia */}
              {getAppointmentsForDay(selectedDate).length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-teal-600" />
                    Sessões
                  </h5>
                  <div className="space-y-2">
                    {getAppointmentsForDay(selectedDate).map((apt) => (
                      <div
                        key={apt.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border shadow-sm",
                          apt.estado === 'realizado' 
                            ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                            : "bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shadow-md",
                            apt.estado === 'realizado'
                              ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20"
                              : "bg-gradient-to-br from-teal-500 to-cyan-600 shadow-teal-500/20"
                          )}>
                            {apt.estado === 'realizado' 
                              ? <CheckCircle className="h-5 w-5 text-white" />
                              : <CalendarCheck className="h-5 w-5 text-white" />
                            }
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 text-sm">
                              {apt.titulo || 'Sessão'}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs text-gray-600">{apt.hora}</span>
                              {apt.terapeuta && (
                                <span className="text-xs text-gray-500">• {apt.terapeuta}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge className={cn(
                          "border-0 text-xs",
                          apt.estado === 'realizado' && "bg-green-100 text-green-700",
                          apt.estado === 'confirmado' && "bg-blue-100 text-blue-700",
                          apt.estado === 'pendente' && "bg-amber-100 text-amber-700",
                          apt.estado === 'agendado' && "bg-teal-100 text-teal-700",
                          apt.estado === 'cancelado' && "bg-red-100 text-red-700"
                        )}>
                          {apt.estado === 'realizado' ? '✓ Realizado' :
                           apt.estado === 'confirmado' ? 'Confirmado' :
                           apt.estado === 'pendente' ? 'Pendente' :
                           apt.estado === 'agendado' ? 'Agendado' :
                           apt.estado}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disponibilidades do dia */}
              <div className="mb-3">
                <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  Disponibilidades
                </h5>
                {getAvailabilitiesForDay(selectedDate).length === 0 ? (
                  <div className="text-center py-4 bg-white/50 rounded-lg">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm text-gray-500">Nenhuma disponibilidade configurada</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getAvailabilitiesForDay(selectedDate).map((avail) => (
                      <div
                        key={avail.id}
                        className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                            <Clock className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900">
                              {avail.hora_inicio} - {avail.hora_fim}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                                {avail.preferencia}
                              </Badge>
                              {avail.recorrencia === 'diaria' && (
                                <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                                  Única
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAvailability(avail)}
                            className="h-8 px-3 text-xs rounded-lg hover:bg-gray-100"
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAvailability(avail.id)}
                            className="h-8 w-8 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={() => {
                  setEditingAvailability(null);
                  setIsDialogOpen(true);
                }}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-amber-500/30 transition-all hover:shadow-xl hover:shadow-amber-500/40"
              >
                <Plus className="h-5 w-5 mr-2" />
                Adicionar Horário
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Availability Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={cn(
          "max-h-[90vh] overflow-y-auto",
          isMobile ? "w-[95vw] max-w-[95vw] rounded-lg" : "max-w-2xl"
        )}>
          <DialogHeader>
            <DialogTitle className={isMobile ? "text-lg" : ""}>
              {editingAvailability ? 'Editar Disponibilidade' : 'Nova Disponibilidade'}
            </DialogTitle>
            <DialogDescription className={isMobile ? "text-sm" : ""}>
              {selectedDate
                ? `Configure seu horário disponível para ${format(selectedDate, isMobile ? "EEE, d 'de' MMM" : "EEEE, d 'de' MMMM", { locale: ptBR })}. Adicione um horário de cada vez.`
                : 'Configure seu horário disponível. Selecione um dia de cada vez.'}
            </DialogDescription>
          </DialogHeader>
          <AvailabilityForm
            clienteId={clienteId}
            availability={editingAvailability || undefined}
            defaultDiaSemana={selectedDate?.getDay()}
            defaultDate={selectedDate || undefined}
            onSuccess={() => {
              setIsDialogOpen(false);
              setEditingAvailability(null);
            }}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingAvailability(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

