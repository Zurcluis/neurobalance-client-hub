import React, { useState, useEffect, useRef } from 'react';
import { format, isSameDay, addDays, subDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import { parseLocalISO } from '@/utils/dateUtils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Appointment } from '@/hooks/useAppointments';

const isLightColor = (hex: string): boolean => {
  if (!hex || hex.length < 6) return false;
  const c = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128;
};

interface TimeGridViewProps {
  days: Date[];
  appointments: Appointment[];
  onTimeSlotClick: (date: Date) => void;
  onEventClick: (appointment: Appointment) => void;
  onDateChange?: (date: Date) => void;
  isDailyView?: boolean;
  availabilities?: Record<number, any[]>;
  showAvailabilities?: boolean;
  holidays?: any[];
  onEventDrop?: (appointment: Appointment, newDate: Date) => void;
}

const HOUR_HEIGHT = 60; // 60px por hora

export const parseAppointmentTimes = (appointment: Appointment) => {
  const aptDate = parseLocalISO(appointment.data);
  let startHour = aptDate.getHours();
  let startMin = aptDate.getMinutes();
  let endHour = startHour + 1;
  let endMin = startMin;

  let horaStr = appointment.hora || '';
  if (horaStr.includes('|')) {
    horaStr = horaStr.split('|')[0].trim();
  }
  if (horaStr.includes('-')) {
    const parts = horaStr.split('-').map(s => s.trim());
    if (parts[0]) {
      const [h, m] = parts[0].split(':').map(Number);
      if (!isNaN(h)) {
        startHour = h;
        startMin = isNaN(m) ? 0 : m;
      }
    }
    if (parts[1]) {
      const [h, m] = parts[1].split(':').map(Number);
      if (!isNaN(h)) {
        endHour = h;
        endMin = isNaN(m) ? 0 : m;
      }
    }
  } else if (horaStr.includes(':')) {
    const [h, m] = horaStr.split(':').map(Number);
    if (!isNaN(h)) {
      startHour = h;
      startMin = isNaN(m) ? 0 : m;
      endHour = startHour + 1;
      endMin = startMin;
    }
  }

  const startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;
  if (endMinutes <= startMinutes) {
    endMinutes = startMinutes + 60;
  }

  const formatTime = (h: number, m: number) =>
    `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

  const timeRangeLabel = `${formatTime(startHour, startMin)} – ${formatTime(Math.floor(endMinutes / 60) % 24, endMinutes % 60)}`;

  return { startMinutes, endMinutes, timeRangeLabel, startHour, startMin };
};

interface LayoutAppointment {
  appointment: Appointment;
  startMinutes: number;
  endMinutes: number;
  timeRangeLabel: string;
  colIndex: number;
  maxCols: number;
  isContainer?: boolean;
  isSubEvent?: boolean;
  zIndex?: number;
}

const getDayLayoutAppointments = (dayAppts: Appointment[]): LayoutAppointment[] => {
  const parsed = dayAppts.map(apt => {
    const times = parseAppointmentTimes(apt);
    return {
      appointment: apt,
      startMinutes: times.startMinutes,
      endMinutes: times.endMinutes,
      timeRangeLabel: times.timeRangeLabel,
      colIndex: 0,
      maxCols: 1,
      isContainer: false,
      isSubEvent: false,
      zIndex: 2,
    };
  });

  parsed.sort((a, b) => 
    a.startMinutes - b.startMinutes || (b.endMinutes - b.startMinutes) - (a.endMinutes - a.startMinutes)
  );

  const clusters: typeof parsed[] = [];
  let currentCluster: typeof parsed = [];
  let clusterEnd = -1;

  for (const item of parsed) {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      clusterEnd = item.endMinutes;
    } else if (item.startMinutes < clusterEnd) {
      currentCluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.endMinutes);
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      clusterEnd = item.endMinutes;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const result: LayoutAppointment[] = [];

  for (const cluster of clusters) {
    if (cluster.length === 1) {
      cluster[0].colIndex = 0;
      cluster[0].maxCols = 1;
      cluster[0].zIndex = 2;
      result.push(cluster[0]);
      continue;
    }

    // Encontrar o evento de maior duração em TODO o cluster
    let longestEvent = cluster[0];
    let maxDuration = longestEvent.endMinutes - longestEvent.startMinutes;

    for (const item of cluster) {
      const dur = item.endMinutes - item.startMinutes;
      if (dur > maxDuration) {
        maxDuration = dur;
        longestEvent = item;
      }
    }

    const isContainer = maxDuration >= 90 && cluster.length > 1;

    if (isContainer) {
      longestEvent.isContainer = true;
      longestEvent.colIndex = 0;
      longestEvent.maxCols = 1;
      longestEvent.zIndex = 1;
      result.push(longestEvent);

      const remainingEvents = cluster.filter(item => item !== longestEvent);
      const subColumns: typeof parsed[] = [];

      for (const item of remainingEvents) {
        item.isSubEvent = true;
        item.zIndex = 10;
        let placed = false;
        for (let i = 0; i < subColumns.length; i++) {
          const lastInCol = subColumns[i][subColumns[i].length - 1];
          if (lastInCol.endMinutes <= item.startMinutes) {
            subColumns[i].push(item);
            item.colIndex = i;
            placed = true;
            break;
          }
        }
        if (!placed) {
          item.colIndex = subColumns.length;
          subColumns.push([item]);
        }
      }

      const numSubCols = subColumns.length;
      for (const item of remainingEvents) {
        item.maxCols = numSubCols;
        result.push(item);
      }
    } else {
      const columns: typeof parsed[] = [];
      for (const item of cluster) {
        let placed = false;
        for (let i = 0; i < columns.length; i++) {
          const lastInCol = columns[i][columns[i].length - 1];
          if (lastInCol.endMinutes <= item.startMinutes) {
            columns[i].push(item);
            item.colIndex = i;
            placed = true;
            break;
          }
        }
        if (!placed) {
          item.colIndex = columns.length;
          columns.push([item]);
        }
      }

      const numCols = columns.length;
      for (const item of cluster) {
        item.maxCols = numCols;
        item.zIndex = 2;
        result.push(item);
      }
    }
  }

  return result;
};

export const isAllDayAppointment = (appointment: Appointment) => {
  const horaStr = appointment.hora || '';
  if (horaStr === 'Todo o dia' || horaStr.startsWith('Todo o dia')) return true;
  if (horaStr.includes('00:00 - 23:59')) return true;
  return false;
};

export interface AllDayBar {
  id: string | number;
  appointment: Appointment;
  titulo: string;
  cor: string;
  startIndex: number;
  endIndex: number;
  span: number;
  rowIndex: number;
}

export const getAllDayBars = (appointments: Appointment[], days: Date[]): AllDayBar[] => {
  if (days.length === 0) return [];
  const weekStart = days[0];
  const weekEnd = days[days.length - 1];

  const allDayAppointments = appointments.filter(app => isAllDayAppointment(app));
  const groups: Appointment[][] = [];

  allDayAppointments.forEach(app => {
    let foundGroup = false;
    for (const group of groups) {
      const first = group[0];
      if (
        first.titulo === app.titulo &&
        first.id_cliente === app.id_cliente &&
        (first.cor === app.cor || (!first.cor && !app.cor))
      ) {
        group.push(app);
        foundGroup = true;
        break;
      }
    }

    if (!foundGroup) {
      groups.push([app]);
    }
  });

  const bars: AllDayBar[] = [];

  groups.forEach((group) => {
    const dates = group.map(a => parseLocalISO(a.data)).sort((a, b) => a.getTime() - b.getTime());
    const firstDate = dates[0];
    let endDate = dates[dates.length - 1];

    const horaStr = group[0].hora || '';
    if (horaStr.includes('|')) {
      const datePart = horaStr.split('|')[1]?.trim();
      if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        endDate = parseLocalISO(`${datePart}T00:00:00`);
      }
    }

    let startIndex = -1;
    let endIndex = -1;

    days.forEach((day, dIdx) => {
      if (isSameDay(day, firstDate) || (firstDate < day && startIndex === -1)) {
        startIndex = dIdx;
      }
      if (isSameDay(day, endDate) || (day <= endDate)) {
        endIndex = dIdx;
      }
    });

    if (startIndex === -1 && firstDate < weekStart) startIndex = 0;
    if (endIndex === -1 && endDate > weekEnd) endIndex = days.length - 1;

    if (startIndex >= 0 && endIndex >= 0) {
      const clampedStart = Math.max(0, Math.min(days.length - 1, startIndex));
      const clampedEnd = Math.max(clampedStart, Math.min(days.length - 1, endIndex));
      const span = (clampedEnd - clampedStart) + 1;

      bars.push({
        id: group[0].id,
        appointment: group[0],
        titulo: group[0].titulo || 'Todo o dia',
        cor: group[0].cor || '#d93025',
        startIndex: clampedStart,
        endIndex: clampedEnd,
        span,
        rowIndex: 0
      });
    }
  });

  bars.sort((a, b) => (b.span - a.span) || (a.startIndex - b.startIndex));
  const rowTrackers: number[][] = [];

  bars.forEach(bar => {
    let assignedRow = 0;
    while (true) {
      if (!rowTrackers[assignedRow]) {
        rowTrackers[assignedRow] = [];
      }
      let collision = false;
      for (let d = bar.startIndex; d <= bar.endIndex; d++) {
        if (rowTrackers[assignedRow].includes(d)) {
          collision = true;
          break;
        }
      }
      if (!collision) {
        for (let d = bar.startIndex; d <= bar.endIndex; d++) {
          rowTrackers[assignedRow].push(d);
        }
        bar.rowIndex = assignedRow;
        break;
      }
      assignedRow++;
    }
  });

  return bars;
};

const TimeGridView: React.FC<TimeGridViewProps> = ({
  days,
  appointments,
  onTimeSlotClick,
  onEventClick,
  onDateChange,
  isDailyView = false,
  availabilities = {},
  showAvailabilities = false,
  holidays = [],
  onEventDrop,
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(days[0]);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScrollbarWidth = () => {
      if (scrollRef.current) {
        const w = scrollRef.current.offsetWidth - scrollRef.current.clientWidth;
        setScrollbarWidth(w);
      }
    };
    updateScrollbarWidth();
    window.addEventListener('resize', updateScrollbarWidth);
    return () => window.removeEventListener('resize', updateScrollbarWidth);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (days.length > 0) {
      setCurrentDate(days[0]);
    }
  }, [days]);

  useEffect(() => {
    // Rolar por defeito para as 08:00
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * HOUR_HEIGHT;
    }
  }, []);

  const getAppointmentsForDay = (day: Date, allDayOnly: boolean = false) => {
    return appointments.filter(appointment => {
      const appointmentDate = parseLocalISO(appointment.data);
      if (!isSameDay(appointmentDate, day)) return false;
      const isAllDay = isAllDayAppointment(appointment);
      return allDayOnly ? isAllDay : !isAllDay;
    });
  };

  const getAvailabilitiesForDay = (day: Date) => {
    if (!showAvailabilities) return [];
    const dayOfWeek = day.getDay();
    const dateString = format(day, 'yyyy-MM-dd');
    const avails: any[] = [];

    Object.values(availabilities).forEach((clientAvails) => {
      clientAvails.forEach((avail: any) => {
        if (avail.status !== 'ativo') return;

        let isValidDay = false;
        if (avail.recorrencia === 'diaria') {
          isValidDay = avail.valido_de === dateString;
        } else {
          isValidDay = avail.dia_semana === dayOfWeek;
        }

        if (isValidDay) {
          avails.push(avail);
        }
      });
    });

    return avails;
  };

  const getHolidayForDay = (day: Date) => {
    const dateString = format(day, 'yyyy-MM-dd');
    return holidays.find((holiday: any) => holiday.date === dateString);
  };

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>, day: Date) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const hour = Math.min(23, Math.max(0, Math.floor(offsetY / HOUR_HEIGHT)));
    const minutes = Math.floor((offsetY % HOUR_HEIGHT) / 15) * 15;

    const clickedDate = new Date(day);
    clickedDate.setHours(hour, minutes, 0, 0);
    onTimeSlotClick(clickedDate);
  };

  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    e.dataTransfer.setData('appointmentId', appointment.id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const hour = Math.min(23, Math.max(0, Math.floor(offsetY / HOUR_HEIGHT)));
    const minutes = Math.floor((offsetY % HOUR_HEIGHT) / 15) * 15;

    const appointmentId = e.dataTransfer.getData('appointmentId');
    if (appointmentId && onEventDrop) {
      const appointment = appointments.find(a => a.id.toString() === appointmentId);
      if (appointment) {
        const newDate = new Date(day);
        newDate.setHours(hour, minutes, 0, 0);
        onEventDrop(appointment, newDate);
      }
    }
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const increment = isDailyView ? 1 : 7;
    const newDate = direction === 'prev' ? subDays(currentDate, increment) : addDays(currentDate, increment);
    setCurrentDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    if (onDateChange) {
      onDateChange(today);
    }
  };

  const getCurrentTimePosition = () => {
    const now = currentTime;
    const hour = now.getHours();
    const minutes = now.getMinutes();
    return (hour + minutes / 60) * HOUR_HEIGHT;
  };

  const numCols = days.length;
  const gridColsClass = numCols === 1 ? 'grid-cols-[60px_1fr]' : 'grid-cols-[60px_repeat(7,1fr)]';

  // Formatação dos dias em maiúsculas (ex: DOM., SEG., TER., QUA., QUI., SEX., SÁB.)
  const formatDayName = (day: Date) => {
    const name = format(day, 'EEE', { locale: pt }).toUpperCase().replace('.', '');
    return `${name}.`;
  };

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden h-full shadow-sm min-h-0">
      {/* Navegação Secundária */}
      {(isDailyView || days.length === 7) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white shrink-0">
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="rounded-full px-4 text-xs font-medium border-gray-300 hover:bg-gray-100 text-gray-700"
            >
              Hoje
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDay('prev')}
              className="h-8 w-8 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDay('next')}
              className="h-8 w-8 rounded-full hover:bg-gray-100"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
          <div className="text-base font-medium text-gray-800">
            {isDailyView
              ? format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: pt })
              : `${format(days[0], "d 'de' MMM", { locale: pt })} – ${format(days[days.length - 1], "d 'de' MMM 'de' yyyy", { locale: pt })}`
            }
          </div>
          <div className="w-24"></div>
        </div>
      )}

      {/* Header Fixo dos Dias & Eventos Todo o Dia */}
      {(() => {
        const allDayBars = getAllDayBars(appointments, days);
        const maxRow = allDayBars.length > 0 ? Math.max(...allDayBars.map(b => b.rowIndex)) + 1 : 0;
        const allDayHeight = maxRow > 0 ? maxRow * 28 + 6 : 0;

        return (
          <div
            className="border-b border-gray-200 bg-white shrink-0 z-20 shadow-xs"
            style={{ paddingRight: `${scrollbarWidth}px` }}
          >
            {/* Linha dos Dias da Semana */}
            <div className={`grid ${gridColsClass}`}>
              {/* Célula do Fuso Horário GMT+01 */}
              <div className="p-2 text-[11px] font-semibold text-gray-400 border-r border-gray-200 flex items-end justify-center pb-2">
                GMT+01
              </div>

              {/* Colunas dos dias da semana */}
              {days.map((day, index) => {
                const isTodayDay = isSameDay(day, new Date());
                const dayHoliday = getHolidayForDay(day);

                return (
                  <div key={index} className="py-2 px-1 text-center border-r border-gray-200 last:border-r-0 select-none">
                    <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                      isTodayDay ? 'text-[#1a73e8]' : 'text-gray-500'
                    }`}>
                      {formatDayName(day)}
                    </div>
                    <div className={`text-2xl font-normal mx-auto ${
                      isTodayDay
                        ? 'bg-[#1a73e8] text-white w-10 h-10 rounded-full flex items-center justify-center font-medium shadow-xs'
                        : 'text-gray-800'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    {dayHoliday && (
                      <div className="mt-1 text-[10px] bg-red-100 text-red-700 font-medium px-1 rounded truncate" title={dayHoliday.name}>
                        {dayHoliday.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Linha de Eventos "Todo o dia" Contínuos (Estilo Google Calendar) */}
            {allDayBars.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50/40 relative">
                <div className={`grid ${gridColsClass} relative`} style={{ minHeight: `${allDayHeight}px` }}>
                  {/* Célula de Rótulo Todo o Dia */}
                  <div className="p-1 text-[10px] font-semibold text-gray-400 border-r border-gray-200 flex items-center justify-center bg-gray-50/70 select-none">
                    Todo o dia
                  </div>

                  {/* Linhas Divisórias Verticais em Fundo */}
                  {days.map((_, dIdx) => (
                    <div key={dIdx} className="border-r border-gray-200 last:border-r-0 h-full" />
                  ))}

                  {/* Barras Contínuas de Eventos de Vários Dias */}
                  {allDayBars.map(bar => (
                    <div
                      key={bar.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick(bar.appointment); }}
                      className="absolute z-10 h-6 px-3 text-xs font-semibold text-white shadow-xs flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity rounded-md"
                      style={{
                        gridColumnStart: bar.startIndex + 2,
                        gridColumnEnd: `span ${bar.span}`,
                        top: `${3 + bar.rowIndex * 28}px`,
                        left: '4px',
                        right: '4px',
                        backgroundColor: bar.cor || '#d93025'
                      }}
                      title={`${bar.titulo} (Todo o dia)`}
                    >
                      <span className="truncate">{bar.titulo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Timeline de 24h Scrollável */}
      <div ref={scrollRef} className="flex-1 overflow-y-scroll relative bg-white min-h-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
        <div className={`grid ${gridColsClass} relative min-h-[1440px]`}>
          
          {/* Coluna da Esquerda: Horas (00:00 às 23:00) */}
          <div className="border-r border-gray-200 select-none bg-white relative">
            {hours.map(hour => (
              <div
                key={hour}
                className="absolute right-2 text-[11px] font-medium text-gray-400"
                style={{ top: `${hour * HOUR_HEIGHT}px`, transform: 'translateY(-50%)' }}
              >
                {hour === 0 ? '' : `${hour.toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {/* Colunas dos Dias */}
          {days.map((day, dayIndex) => {
            const dayAppts = getAppointmentsForDay(day);
            const layoutAppts = getDayLayoutAppointments(dayAppts);
            const dayAvails = getAvailabilitiesForDay(day);
            const isTodayDay = isSameDay(day, new Date());

            return (
              <div
                key={dayIndex}
                className="border-r border-gray-200 last:border-r-0 relative min-h-[1440px] hover:bg-blue-50/10 transition-colors cursor-pointer"
                onClick={(e) => handleGridClick(e, day)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day)}
              >
                {/* Linhas das horas e meias-horas */}
                {hours.map(hour => (
                  <React.Fragment key={hour}>
                    <div
                      className="absolute left-0 right-0 border-t border-gray-100 pointer-events-none"
                      style={{ top: `${hour * HOUR_HEIGHT}px` }}
                    />
                    <div
                      className="absolute left-0 right-0 border-t border-dashed border-gray-50 pointer-events-none"
                      style={{ top: `${hour * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
                    />
                  </React.Fragment>
                ))}

                {/* Linha Vermelha de Hora Atual */}
                {isTodayDay && (
                  <div
                    className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                    style={{
                      top: `${getCurrentTimePosition()}px`,
                      transform: 'translateY(-50%)'
                    }}
                  >
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-1.25 shadow-xs" />
                    <div className="flex-1 h-0.5 bg-red-500" />
                  </div>
                )}

                {/* Disponibilidades dos Clientes (Fundo sutil) */}
                {showAvailabilities && dayAvails.map((avail: any, idx: number) => {
                  const [sH, sM] = (avail.hora_inicio || '09:00').split(':').map(Number);
                  const [eH, eM] = (avail.hora_fim || '18:00').split(':').map(Number);
                  const top = ((sH + (sM || 0) / 60)) * HOUR_HEIGHT;
                  const height = (((eH + (eM || 0) / 60) - (sH + (sM || 0) / 60))) * HOUR_HEIGHT;

                  return (
                    <div
                      key={`avail-${idx}`}
                      className="absolute left-1 right-1 bg-blue-50/60 border border-blue-200/60 rounded text-[10px] text-blue-700 p-1 pointer-events-none z-0 truncate"
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <span className="font-semibold">{avail.clientes?.id_manual ? `${avail.clientes.id_manual} - ` : ''}</span>
                      {avail.clientes?.nome || 'Disponível'}
                    </div>
                  );
                })}

                {/* Renderização dos Eventos (Estilo Imagem 2: Contentor em Fundo e Sub-eventos Sobrepostos) */}
                {layoutAppts.map((item, idx) => {
                  const { appointment, startMinutes, endMinutes, timeRangeLabel, colIndex, maxCols, isContainer, isSubEvent, zIndex } = item;
                  const top = (startMinutes / 60) * HOUR_HEIGHT;
                  const durationMinutes = Math.max(20, endMinutes - startMinutes);
                  const height = (durationMinutes / 60) * HOUR_HEIGHT;

                  let leftStyle: React.CSSProperties = {};

                  if (isContainer) {
                    leftStyle = {
                      left: '2px',
                      right: '2px',
                      width: 'calc(100% - 4px)',
                      zIndex: 1
                    };
                  } else if (isSubEvent) {
                    const subWidthPercent = (100 - 6) / maxCols;
                    const subLeftPercent = 6 + colIndex * subWidthPercent;
                    leftStyle = {
                      left: `${subLeftPercent}%`,
                      width: `calc(${subWidthPercent}% - 4px)`,
                      zIndex: zIndex || 10
                    };
                  } else {
                    const widthPercent = 100 / maxCols;
                    const leftPercent = colIndex * widthPercent;
                    leftStyle = {
                      left: `calc(${leftPercent}% + 2px)`,
                      width: `calc(${widthPercent}% - 4px)`,
                      zIndex: zIndex || 2
                    };
                  }

                  const color = (appointment as any).cor || '#039be5';
                  const isLight = isLightColor(color);
                  const textColor = isLight ? '#111827' : '#ffffff';
                  const clientInfo = (appointment as any).clientes;
                  const displayTitle = clientInfo?.id_manual || clientInfo?.nome || appointment.titulo || 'Agendamento';

                  return (
                    <div
                      key={`appt-${appointment.id}-${idx}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, appointment)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(appointment);
                      }}
                      className={`absolute rounded-lg p-2 cursor-pointer shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-start select-none ${
                        isSubEvent ? 'border-2 border-white ring-1 ring-black/10' : 'border border-black/10'
                      }`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: color,
                        color: textColor,
                        ...leftStyle
                      }}
                      title={`${displayTitle} (${timeRangeLabel})`}
                    >
                      <div className="font-bold text-xs truncate leading-tight">
                        {displayTitle}
                      </div>
                      {height >= 34 && (
                        <div className="text-[11px] opacity-90 truncate leading-tight mt-0.5">
                          {timeRangeLabel}
                        </div>
                      )}
                      {height >= 55 && (appointment.tipo || appointment.notas) && (
                        <div className="text-[10px] opacity-80 truncate leading-tight capitalize mt-0.5">
                          {appointment.tipo} {appointment.notas ? `• ${appointment.notas}` : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimeGridView;