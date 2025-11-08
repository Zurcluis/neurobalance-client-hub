/**
 * ALGORITMO DE SUGESTÃO DE AGENDAMENTOS
 * 
 * Este algoritmo analisa:
 * - Disponibilidade do cliente
 * - Histórico de agendamentos (horários preferidos)
 * - Gaps no calendário
 * - Preferências configuradas
 * 
 * E gera sugestões automáticas com score de compatibilidade.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';
import type {
  ClientAvailability,
  NewSuggestedAppointment,
  PreferenciaNivel,
} from '@/types/availability';
import { addDays, format, parse, isAfter, isBefore, isEqual, startOfDay } from 'date-fns';

// =====================================================
// TYPES
// =====================================================

interface TimeSlot {
  data: string; // YYYY-MM-DD
  hora_inicio: string; // HH:mm
  hora_fim: string; // HH:mm
  dia_semana: number; // 0-6
}

interface HistoricalPattern {
  dia_semana_preferido: number;
  hora_inicio_preferida: string;
  frequencia_semanal: number;
}

interface SuggestionWithReasons {
  suggestion: NewSuggestedAppointment;
  reasons: string[];
}

// =====================================================
// CONSTANTS
// =====================================================

const DEFAULT_SESSION_DURATION_MINUTES = 60;
const DAYS_TO_SUGGEST = 14; // Próximos 14 dias
const MAX_SUGGESTIONS = 5;

// Pesos para o cálculo do score (total = 100)
const WEIGHTS = {
  PREFERENCE_LEVEL: 30,
  HISTORICAL_MATCH: 25,
  TIME_CONVENIENCE: 20,
  CALENDAR_GAP: 15,
  RECENCY: 10,
};

// =====================================================
// MAIN FUNCTION: Generate Suggestions
// =====================================================

export async function generateSuggestionsForClient(
  clienteId: number,
  adminId: string,
  options?: {
    daysAhead?: number;
    maxSuggestions?: number;
    sessionDurationMinutes?: number;
  }
): Promise<SuggestionWithReasons[]> {
  const daysAhead = options?.daysAhead || DAYS_TO_SUGGEST;
  const maxSuggestions = options?.maxSuggestions || MAX_SUGGESTIONS;
  const sessionDuration = options?.sessionDurationMinutes || DEFAULT_SESSION_DURATION_MINUTES;

  logger.log(`Generating suggestions for client ${clienteId}`);

  try {
    // 1. Buscar disponibilidade do cliente
    const availability = await fetchClientAvailability(clienteId);
    if (availability.length === 0) {
      logger.warn(`No availability found for client ${clienteId}`);
      return [];
    }

    // 2. Buscar padrão histórico de agendamentos
    const historicalPattern = await analyzeHistoricalPattern(clienteId);

    // 3. Buscar agendamentos existentes (para evitar conflitos)
    const existingAppointments = await fetchExistingAppointments(clienteId, daysAhead);

    // 4. Gerar slots disponíveis nos próximos N dias
    const availableSlots = generateAvailableSlots(
      availability,
      daysAhead,
      sessionDuration,
      existingAppointments
    );

    // 5. Calcular score e razões para cada slot
    const scoredSuggestions = availableSlots.map((slot) => {
      const { score, reasons } = calculateCompatibilityScore(
        slot,
        availability,
        historicalPattern
      );

      const suggestion: NewSuggestedAppointment = {
        cliente_id: clienteId,
        admin_id: adminId,
        data_sugerida: slot.data,
        hora_inicio: slot.hora_inicio,
        hora_fim: slot.hora_fim,
        compatibilidade_score: score,
        razoes_sugestao: reasons.join('; '),
        status: 'pendente',
        expira_em: addDays(new Date(), 7).toISOString(), // Expira em 7 dias
      };

      return { suggestion, reasons };
    });

    // 6. Ordenar por score (maior primeiro) e pegar os top N
    scoredSuggestions.sort((a, b) => b.suggestion.compatibilidade_score - a.suggestion.compatibilidade_score);
    const topSuggestions = scoredSuggestions.slice(0, maxSuggestions);

    logger.log(`Generated ${topSuggestions.length} suggestions for client ${clienteId}`);
    return topSuggestions;
  } catch (error) {
    logger.error('Error generating suggestions:', error);
    throw error;
  }
}

// =====================================================
// HELPER: Fetch Client Availability
// =====================================================

async function fetchClientAvailability(clienteId: number): Promise<ClientAvailability[]> {
  const { data, error } = await supabase
    .from('client_availability')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('status', 'ativo');

  if (error) throw error;
  return data || [];
}

// =====================================================
// HELPER: Analyze Historical Pattern
// =====================================================

async function analyzeHistoricalPattern(clienteId: number): Promise<HistoricalPattern | null> {
  const { data, error } = await supabase
    .from('agendamentos')
    .select('data_hora')
    .eq('cliente_id', clienteId)
    .eq('status', 'concluido')
    .order('data_hora', { ascending: false })
    .limit(20);

  if (error || !data || data.length === 0) return null;

  // Analisar padrões: dia da semana e hora mais frequentes
  const dayCount: Record<number, number> = {};
  const hourCount: Record<string, number> = {};

  data.forEach((appointment) => {
    const date = new Date(appointment.data_hora);
    const dayOfWeek = date.getDay();
    const hour = format(date, 'HH:mm');

    dayCount[dayOfWeek] = (dayCount[dayOfWeek] || 0) + 1;
    hourCount[hour] = (hourCount[hour] || 0) + 1;
  });

  const mostFrequentDay = Object.entries(dayCount).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  const mostFrequentHour = Object.entries(hourCount).reduce((a, b) => (b[1] > a[1] ? b : a))[0];

  return {
    dia_semana_preferido: parseInt(mostFrequentDay),
    hora_inicio_preferida: mostFrequentHour,
    frequencia_semanal: data.length / 4, // Média mensal / 4 semanas
  };
}

// =====================================================
// HELPER: Fetch Existing Appointments
// =====================================================

async function fetchExistingAppointments(clienteId: number, daysAhead: number): Promise<TimeSlot[]> {
  const startDate = startOfDay(new Date());
  const endDate = addDays(startDate, daysAhead);

  const { data, error } = await supabase
    .from('agendamentos')
    .select('data_hora')
    .eq('cliente_id', clienteId)
    .gte('data_hora', startDate.toISOString())
    .lte('data_hora', endDate.toISOString())
    .in('status', ['confirmado', 'pendente']);

  if (error || !data) return [];

  return data.map((appointment) => {
    const date = new Date(appointment.data_hora);
    return {
      data: format(date, 'yyyy-MM-dd'),
      hora_inicio: format(date, 'HH:mm'),
      hora_fim: format(addMinutesToTime(date, 60), 'HH:mm'),
      dia_semana: date.getDay(),
    };
  });
}

// =====================================================
// HELPER: Generate Available Slots
// =====================================================

function generateAvailableSlots(
  availability: ClientAvailability[],
  daysAhead: number,
  sessionDurationMinutes: number,
  existingAppointments: TimeSlot[]
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const today = startOfDay(new Date());

  for (let i = 1; i <= daysAhead; i++) {
    const targetDate = addDays(today, i);
    const dayOfWeek = targetDate.getDay();
    const dateString = format(targetDate, 'yyyy-MM-dd');

    // Buscar disponibilidade para este dia da semana
    const dayAvailability = availability.filter((avail) => avail.dia_semana === dayOfWeek);

    dayAvailability.forEach((avail) => {
      // Verificar se está dentro do período de validade
      if (avail.data_inicio && isBefore(targetDate, new Date(avail.data_inicio))) return;
      if (avail.data_fim && isAfter(targetDate, new Date(avail.data_fim))) return;

      // Gerar slots de 30 em 30 minutos dentro da janela disponível
      const startTime = parse(avail.hora_inicio, 'HH:mm', new Date());
      const endTime = parse(avail.hora_fim, 'HH:mm', new Date());

      let currentTime = startTime;

      while (isBefore(currentTime, endTime)) {
        const slotEnd = addMinutesToTime(currentTime, sessionDurationMinutes);

        if (isAfter(slotEnd, endTime)) break; // Não cabe mais uma sessão completa

        const slotStart = format(currentTime, 'HH:mm');
        const slotEndFormatted = format(slotEnd, 'HH:mm');

        // Verificar se não conflita com agendamento existente
        const hasConflict = existingAppointments.some((existing) => {
          if (existing.data !== dateString) return false;
          
          const existingStart = parse(existing.hora_inicio, 'HH:mm', new Date());
          const existingEnd = parse(existing.hora_fim, 'HH:mm', new Date());
          const newStart = parse(slotStart, 'HH:mm', new Date());
          const newEnd = parse(slotEndFormatted, 'HH:mm', new Date());

          // Verifica sobreposição
          return (
            (isAfter(newStart, existingStart) && isBefore(newStart, existingEnd)) ||
            (isAfter(newEnd, existingStart) && isBefore(newEnd, existingEnd)) ||
            (isBefore(newStart, existingStart) && isAfter(newEnd, existingEnd)) ||
            isEqual(newStart, existingStart)
          );
        });

        if (!hasConflict) {
          slots.push({
            data: dateString,
            hora_inicio: slotStart,
            hora_fim: slotEndFormatted,
            dia_semana: dayOfWeek,
          });
        }

        // Avançar 30 minutos
        currentTime = addMinutesToTime(currentTime, 30);
      }
    });
  }

  return slots;
}

// =====================================================
// HELPER: Calculate Compatibility Score
// =====================================================

function calculateCompatibilityScore(
  slot: TimeSlot,
  availability: ClientAvailability[],
  historicalPattern: HistoricalPattern | null
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // 1. PESO: Nível de Preferência (30 pontos)
  const matchingAvailability = availability.find(
    (avail) => avail.dia_semana === slot.dia_semana
  );

  if (matchingAvailability) {
    const preferenceScore = getPreferenceScore(matchingAvailability.preferencia);
    score += (preferenceScore / 100) * WEIGHTS.PREFERENCE_LEVEL;
    
    if (matchingAvailability.preferencia === 'alta') {
      reasons.push('Horário de alta preferência do cliente');
    }
  }

  // 2. PESO: Correspondência Histórica (25 pontos)
  if (historicalPattern) {
    if (slot.dia_semana === historicalPattern.dia_semana_preferido) {
      score += WEIGHTS.HISTORICAL_MATCH * 0.6;
      reasons.push('Dia da semana historicamente preferido');
    }

    if (slot.hora_inicio === historicalPattern.hora_inicio_preferida) {
      score += WEIGHTS.HISTORICAL_MATCH * 0.4;
      reasons.push('Horário historicamente preferido');
    }
  }

  // 3. PESO: Conveniência de Horário (20 pontos)
  const hour = parseInt(slot.hora_inicio.split(':')[0]);
  
  if (hour >= 9 && hour <= 12) {
    score += WEIGHTS.TIME_CONVENIENCE * 0.8; // Manhã é bom
    reasons.push('Horário matutino conveniente');
  } else if (hour >= 14 && hour <= 18) {
    score += WEIGHTS.TIME_CONVENIENCE * 0.6; // Tarde é ok
    reasons.push('Horário vespertino disponível');
  } else {
    score += WEIGHTS.TIME_CONVENIENCE * 0.3; // Outros horários
  }

  // 4. PESO: Preenchimento de Gaps (15 pontos)
  const slotDate = new Date(slot.data);
  const daysUntilSlot = Math.floor(
    (slotDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilSlot >= 3 && daysUntilSlot <= 7) {
    score += WEIGHTS.CALENDAR_GAP;
    reasons.push('Preenche gap ideal no calendário (3-7 dias)');
  } else if (daysUntilSlot < 3) {
    score += WEIGHTS.CALENDAR_GAP * 0.5;
    reasons.push('Disponível em breve');
  }

  // 5. PESO: Recência (10 pontos) - Preferir datas mais próximas
  const recencyScore = Math.max(0, 10 - daysUntilSlot);
  score += (recencyScore / 10) * WEIGHTS.RECENCY;

  if (daysUntilSlot <= 3) {
    reasons.push('Disponível nos próximos dias');
  }

  return { score: Math.round(score), reasons };
}

// =====================================================
// HELPER: Get Preference Score
// =====================================================

function getPreferenceScore(preferencia: PreferenciaNivel): number {
  switch (preferencia) {
    case 'alta':
      return 100;
    case 'media':
      return 60;
    case 'baixa':
      return 30;
    default:
      return 50;
  }
}

// =====================================================
// HELPER: Add Minutes to Time
// =====================================================

function addMinutesToTime(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

