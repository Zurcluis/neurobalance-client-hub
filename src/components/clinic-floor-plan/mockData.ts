import { RoomData } from './types';

export const initialMockRooms: RoomData[] = [
  {
    roomId: 'sala-1',
    roomName: 'Sala 1',
    serviceType: 'Yoga Nidra',
    status: 'livre',
  },
  {
    roomId: 'sala-2',
    roomName: 'Sala 2',
    serviceType: 'Terapia Ocupacional',
    status: 'ocupada',
    currentClientName: 'João Silva',
    therapistName: 'Terapeuta Ana',
    sessionStart: new Date(new Date().getTime() - 40 * 60000).toISOString(),
    sessionEnd: new Date(new Date().getTime() + 20 * 60000).toISOString(),
  },
  {
    roomId: 'sala-3',
    roomName: 'Sala 3',
    serviceType: 'Neurofeedback',
    status: 'ocupada',
    currentClientName: 'Maria Costa',
    therapistName: 'Bárbara Carvalho',
    sessionStart: new Date(new Date().getTime() - 10 * 60000).toISOString(),
    sessionEnd: new Date(new Date().getTime() + 40 * 60000).toISOString(),
  },
  {
    roomId: 'sala-4',
    roomName: 'Sala 4',
    serviceType: 'Avaliação / Consulta',
    status: 'livre',
  },
  {
    roomId: 'sala-5',
    roomName: 'Sala 5',
    serviceType: 'Neurofeedback',
    status: 'a_terminar',
    currentClientName: 'Pedro Martins',
    therapistName: 'Bárbara Carvalho',
    sessionStart: new Date(new Date().getTime() - 55 * 60000).toISOString(),
    sessionEnd: new Date(new Date().getTime() + 5 * 60000).toISOString(),
  },
  {
    roomId: 'sala-6',
    roomName: 'Sala 6',
    serviceType: 'Neurofeedback',
    status: 'indisponivel',
  }
];
