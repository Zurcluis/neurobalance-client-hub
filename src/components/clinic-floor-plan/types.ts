export type RoomStatus = 'livre' | 'ocupada' | 'a_terminar' | 'atrasada' | 'indisponivel';

export interface RoomData {
  roomId: string;
  roomName: string;
  serviceType: string;
  status: RoomStatus;
  currentClientId?: string;
  currentClientName?: string;
  therapistId?: string;
  therapistName?: string;
  sessionStart?: string;
  sessionEnd?: string;
  notes?: string;
}
