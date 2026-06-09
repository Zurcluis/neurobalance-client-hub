import React, { useState, useEffect } from 'react';
import { initialMockRooms } from '../components/clinic-floor-plan/mockData';
import { RoomData } from '../components/clinic-floor-plan/types';
import { SummaryCards } from '../components/clinic-floor-plan/SummaryCards';
import { ClinicFloorPlan } from '../components/clinic-floor-plan/ClinicFloorPlan';
import { RoomDetailsPanel } from '../components/clinic-floor-plan/RoomDetailsPanel';
import { StatusLegend } from '../components/clinic-floor-plan/StatusLegend';
import PageLayout from '@/components/layout/PageLayout';

interface ClinicFloorPlanPageProps {
  isEmbedded?: boolean;
}

const ClinicFloorPlanPage: React.FC<ClinicFloorPlanPageProps> = ({ isEmbedded = false }) => {
  const [rooms, setRooms] = useState<RoomData[]>(initialMockRooms);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Time checker to automatically update room statuses based on sessionEnd
  useEffect(() => {
    const checkStatuses = () => {
      const now = new Date().getTime();

      setRooms(prevRooms => prevRooms.map(room => {
        if (!room.sessionEnd) return room;

        const endTime = new Date(room.sessionEnd).getTime();
        const difference = endTime - now;

        let newStatus = room.status;

        if (difference <= 0) {
          newStatus = 'atrasada';
        } else if (difference <= 10 * 60000) { // 10 minutes
          newStatus = 'a_terminar';
        } else if (room.status === 'a_terminar' && difference > 10 * 60000) {
           newStatus = 'ocupada'; // Case someone extended the time
        }

        if (newStatus !== room.status) {
          return { ...room, status: newStatus };
        }

        return room;
      }));
    };

    // Check immediately and then every 30 seconds
    checkStatuses();
    const interval = setInterval(checkStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRoomSelect = (room: RoomData) => {
    setSelectedRoomId(room.roomId);
  };

  const handleUpdateRoom = (roomId: string, updates: Partial<RoomData>) => {
    setRooms(prevRooms => prevRooms.map(r => {
      if (r.roomId === roomId) {
        return { ...r, ...updates };
      }
      return r;
    }));
  };

  const selectedRoom = selectedRoomId ? rooms.find(r => r.roomId === selectedRoomId) || null : null;

  const content = (
    <div className={isEmbedded ? "w-full" : "p-6 w-full max-w-[1600px] mx-auto min-h-[calc(100vh-4rem)] flex flex-col"}>
      
      {/* Header */}
      {!isEmbedded && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Planta Interativa da Clínica</h1>
          <p className="text-slate-500 mt-1">Estado das salas em tempo real</p>
        </div>
      )}

      {/* Summary Cards */}
      <SummaryCards rooms={rooms} />

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[600px]">
        {/* Floor Plan Area */}
        <div className="flex-1 flex flex-col">
          <ClinicFloorPlan 
            rooms={rooms} 
            selectedRoomId={selectedRoomId} 
            onRoomSelect={handleRoomSelect} 
          />
          <StatusLegend />
        </div>

        {/* Side Panel Area */}
        <div className="w-full lg:w-96 lg:shrink-0 h-[600px] lg:h-auto">
          <RoomDetailsPanel 
            room={selectedRoom} 
            onClose={() => setSelectedRoomId(null)}
            onUpdateRoom={handleUpdateRoom}
          />
        </div>
      </div>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <PageLayout>
      {content}
    </PageLayout>
  );
};

export default ClinicFloorPlanPage;
