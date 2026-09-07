export type RoomStatus = 'livre' | 'ocupada' | 'a_terminar' | 'atrasada' | 'higienizacao' | 'indisponivel';

export interface RoomEquipment {
  name: string;
  icon?: string;
}

export interface RoomAppointmentSlot {
  id: string | number;
  time: string;
  clientName: string;
  therapistName?: string;
  service?: string;
  status?: string;
}

export interface RoomData {
  roomId: string;
  roomName: string;
  serviceType: string;
  status: RoomStatus;
  capacity?: number;
  equipment?: string[];
  currentClientId?: string | number;
  currentClientName?: string;
  therapistId?: string;
  therapistName?: string;
  sessionStart?: string;
  sessionEnd?: string;
  cleaningUntil?: string;
  notes?: string;
  todayAppointments?: RoomAppointmentSlot[];
}
