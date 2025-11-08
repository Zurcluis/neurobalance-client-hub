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
    return availabilities.filter((avail) => avail.dia_semana === dayOfWeek && avail.status === 'ativo');
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

    return (
      <button
        key={date.toString()}
        onClick={() => handleDayClick(date)}
        disabled={!isCurrentMonth}
        className={cn(
          'relative aspect-square p-2 text-center transition-all',
          'hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          isToday && 'bg-blue-50 dark:bg-blue-950 font-bold',
          hasAvail && 'bg-green-50 dark:bg-green-950'
        )}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <span className={cn('text-sm', isToday && 'text-blue-600 dark:text-blue-400')}>
            {format(date, 'd')}
          </span>
          {hasAvail && (
            <Badge
              variant="outline"
              className="mt-1 text-[10px] px-1 py-0 h-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-[#3f9094]" />
                Meu Calendário de Disponibilidade
              </CardTitle>
              <CardDescription>
                Clique em um dia para adicionar seus horários disponíveis
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoje
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h3 className="text-lg font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h3>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="border rounded-lg p-4">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {DIAS_SEMANA.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((date) => renderDayCell(date))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800"></div>
              <span>Hoje</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"></div>
              <span>Com Disponibilidade</span>
            </div>
          </div>

          {/* Selected Day Availabilities */}
          {selectedDate && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#3f9094]" />
                Disponibilidades para {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h4>
              {getAvailabilitiesForDay(selectedDate).length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma disponibilidade configurada para este dia da semana.</p>
              ) : (
                <div className="space-y-2">
                  {getAvailabilitiesForDay(selectedDate).map((avail) => (
                    <div
                      key={avail.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">
                            {avail.hora_inicio} - {avail.hora_fim}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {avail.preferencia}
                          </Badge>
                        </div>
                        {avail.observacoes && (
                          <p className="text-sm text-gray-500 mt-1 ml-6">{avail.observacoes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAvailability(avail)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAvailability(avail.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
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
                className="w-full mt-3 bg-gradient-to-r from-[#3f9094] to-[#2A5854] hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Horário para este Dia
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
                ? `Configure seu horário disponível para ${format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}`
                : 'Configure seu horário disponível'}
            </DialogDescription>
          </DialogHeader>
          <AvailabilityForm
            clienteId={clienteId}
            availability={editingAvailability || undefined}
            defaultDiaSemana={selectedDate?.getDay()}
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

