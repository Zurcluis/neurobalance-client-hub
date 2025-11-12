import React, { useState, useMemo } from 'react';
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
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Plus, X } from 'lucide-react';
import { useClientAvailability } from '@/hooks/useClientAvailability';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AvailabilityForm } from './AvailabilityForm';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { ClientAvailability } from '@/types/availability';
import { getAllHolidaysUntil2040 } from '@/data/portugueseHolidays';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface ClientAvailabilityCalendarProps {
  clienteId: number;
}

export const ClientAvailabilityCalendar: React.FC<ClientAvailabilityCalendarProps> = ({ clienteId }) => {
  const { availabilities, isLoading, deleteAvailability } = useClientAvailability(clienteId);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<ClientAvailability | null>(null);
  
  const holidays = getAllHolidaysUntil2040();
  
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

    return (
      <button
        key={date.toString()}
        onClick={() => handleDayClick(date)}
        disabled={!isCurrentMonth}
        className={cn(
          'relative w-full h-20 p-0.5 text-center transition-all',
          'hover:bg-gray-100 dark:hover:bg-gray-800 rounded',
          'disabled:opacity-30 disabled:cursor-not-allowed',
          isToday && 'bg-blue-50 dark:bg-blue-950 font-bold ring-2 ring-blue-300',
          hasAvail && 'bg-green-50 dark:bg-green-950',
          holiday && holiday.type === 'feriado' && 'bg-red-50 dark:bg-red-950',
          holiday && holiday.type === 'feriado_municipal' && 'bg-orange-50 dark:bg-orange-950',
          holiday && holiday.type === 'dia_importante' && 'bg-purple-50 dark:bg-purple-950'
        )}
        title={holiday ? holiday.name : undefined}
      >
        <div className="flex flex-col items-center justify-center h-full gap-0.5">
          <span className={cn(
            'text-lg font-medium',
            isToday && 'text-blue-600 dark:text-blue-400',
            holiday && 'font-semibold'
          )}>
            {format(date, 'd')}
          </span>
          {holiday && (
            <div className="w-full px-0.5">
              <div className={cn(
                'text-xs px-0.5 py-0 leading-tight truncate rounded',
                holiday.type === 'feriado' && 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200',
                holiday.type === 'feriado_municipal' && 'bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
                holiday.type === 'dia_importante' && 'bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
                (holiday.type === 'tradicao' || holiday.type === 'cultural' || holiday.type === 'religioso') && 'bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
              )}>
                {holiday.name.length > 6 ? holiday.name.substring(0, 5) + '...' : holiday.name}
              </div>
            </div>
          )}
          {hasAvail && !holiday && (
            <Badge
              variant="outline"
              className="text-xs px-1 py-0 h-4 leading-none bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0"
            >
              {availCount}
            </Badge>
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
      <Card>
        <CardContent className="py-12">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="flex flex-col max-w-full">
        <CardHeader className="flex-shrink-0 pb-1 pt-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CalendarIcon className="h-5 w-5 text-[#3f9094]" />
                Meu Calendário de Disponibilidade
              </CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday} className="h-8 text-sm px-3">
              Hoje
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-1 flex-1 pt-2 pb-3">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-1">
            <Button variant="ghost" size="icon" onClick={previousMonth} className="h-8 w-8">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h3 className="text-lg font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h3>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="border rounded p-1">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-0 mb-0.5">
              {DIAS_SEMANA.map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300 py-0.5">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-0">
              {calendarDays.map((date) => renderDayCell(date))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 py-1 flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800"></div>
              <span>Hoje</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"></div>
              <span>Disponível</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"></div>
              <span>Feriado</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800"></div>
              <span>Municipal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800"></div>
              <span>Especial</span>
            </div>
          </div>

          {/* Selected Day Availabilities */}
          {selectedDate && (
            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded border">
              <div className="mb-1">
                <h4 className="text-sm font-semibold mb-0.5 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[#3f9094]" />
                  {format(selectedDate, "EEE, d 'de' MMM", { locale: ptBR })}
                </h4>
                {getHolidayForDay(selectedDate) && (
                  <div className="mb-1 p-1 rounded bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                      🎉 {getHolidayForDay(selectedDate)?.name}
                    </p>
                  </div>
                )}
              </div>
              {getAvailabilitiesForDay(selectedDate).length === 0 ? (
                <p className="text-sm text-gray-500 mb-1">Sem disponibilidade.</p>
              ) : (
                <div className="space-y-1 mb-1">
                  {getAvailabilitiesForDay(selectedDate).map((avail) => (
                    <div
                      key={avail.id}
                      className="flex items-center justify-between p-1.5 bg-white dark:bg-gray-800 rounded border text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {avail.hora_inicio}-{avail.hora_fim}
                        </span>
                        <Badge variant="outline" className="text-xs px-1 py-0 h-5">
                          {avail.preferencia}
                        </Badge>
                        {avail.recorrencia === 'diaria' && (
                          <Badge variant="outline" className="text-xs px-1 py-0 h-5 bg-blue-50">
                            Única
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAvailability(avail)}
                          className="h-7 px-2 text-xs"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAvailability(avail.id)}
                          className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button
                onClick={() => {
                  setEditingAvailability(null);
                  setIsDialogOpen(true);
                }}
                size="sm"
                className="w-full bg-gradient-to-r from-[#3f9094] to-[#2A5854] hover:opacity-90 h-8 text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Horário
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Availability Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAvailability ? 'Editar Disponibilidade' : 'Nova Disponibilidade'}
            </DialogTitle>
            <DialogDescription>
              {selectedDate
                ? `Configure seu horário disponível para ${format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}. Adicione um horário de cada vez.`
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

