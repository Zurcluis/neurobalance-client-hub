import React from 'react';
import { RoomData } from './types';
import { RoomBlock } from './RoomBlock';

interface ClinicFloorPlanProps {
  rooms: RoomData[];
  selectedRoomId: string | null;
  onRoomSelect: (room: RoomData) => void;
}

/**
 * Layout baseado na planta real da Clínica NeuroBalance.
 * 
 * Circulação:
 * ENTRADA (baixo centro) → RECEÇÃO (centro inferior) →
 * SALA 1 (esq. da receção) | SALA 2 (dir. da receção) →
 * CORREDOR CENTRAL (sobe) → SALA 3 (esq. do corredor) →
 * CORREDOR LATERAL ESQ. → WC 1 + WC 2 (dir.) + SALA 4 (fundo) →
 * Continua para dir. → CORREDOR SUPERIOR → SALA 5 + SALA 6 (lado a lado, portas para cima)
 * 
 * Posições em % (left, top, width, height):
 * O contentor de referência é 100% × 100%.
 * 
 *  ┌──────────────────────────────────────────────────────────┐
 *  │  SALA 4     │ WC1│WC2 │  [corredor sup]  │  SALA 5 │SALA 6│
 *  │             │    │    │                  │         │      │
 *  │  [corredor  │    │    │                  │         │      │
 *  │   lateral]  │    │    │                  │         │      │
 *  │  SALA 3     │    │    │                  │         │      │
 *  │             │    │    │                  │         │      │
 *  │─────────────┴────┴────┤  [corr. central] │         │      │
 *  │  SALA 1     │ RECEÇÃO │                  │  SALA 2 │      │
 *  │             │ (balcão)│                  │         │      │
 *  │             │         │                  │         │      │
 *  └─────────────┴────┬────┴──────────────────┴─────────┴──────┘
 *                     │ ENTRADA
 */
export const ClinicFloorPlan: React.FC<ClinicFloorPlanProps> = ({ rooms, selectedRoomId, onRoomSelect }) => {
  const getRoom = (id: string) => rooms.find(r => r.roomId === id) || {
    roomId: id, roomName: id, status: 'indisponivel', serviceType: ''
  } as RoomData;

  // Definição das posições: [left%, top%, width%, height%]
  // O mapa tem 100% × 100% de área útil dentro do container
  const layout = {
    // ──── ZONA SUPERIOR ESQUERDA ────
    // Sala 4: canto superior esquerdo, grande
    'sala-4': { left: '1%', top: '1%', width: '24%', height: '40%' },
    // WC 1: ao lado direito da Sala 4, topo
    'wc1': { left: '26%', top: '1%', width: '9%', height: '18%' },
    // WC 2: ao lado direito do WC1, topo
    'wc2': { left: '36%', top: '1%', width: '9%', height: '18%' },
    // Sala 3: abaixo dos WCs / ao lado direito da Sala 4, centro esquerdo
    'sala-3': { left: '26%', top: '20%', width: '19%', height: '28%' },

    // ──── ZONA SUPERIOR DIREITA ────
    // Sala 5: superior direito, ao lado da sala 6
    'sala-5': { left: '55%', top: '1%', width: '22%', height: '47%' },
    // Sala 6: extremo direito superior
    'sala-6': { left: '78%', top: '1%', width: '21%', height: '47%' },

    // ──── ZONA INFERIOR ────
    // Sala 1: canto inferior esquerdo, grande
    'sala-1': { left: '1%', top: '50%', width: '24%', height: '43%' },
    // Receção: centro inferior
    'rececao': { left: '26%', top: '50%', width: '28%', height: '43%' },
    // Sala 2: inferior direito, grande
    'sala-2': { left: '55%', top: '49%', width: '44%', height: '44%' },

    // ──── CORREDORES ────
    // Corredor central (vertical, entre sala 3/sala 4 e sala 5/6)
    'corredor-c': { left: '46%', top: '1%', width: '8%', height: '92%' },
    // Corredor superior (horizontal, entre WCs e Sala 5/6)
    'corredor-sup': { left: '26%', top: '1%', width: '28%', height: '18%' },

    // Entrada: baixo ao centro, sob a Receção
    'entrada': { left: '33%', top: '94%', width: '14%', height: '5%' },
  };

  const corridorStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    zIndex: 0,
  };

  return (
    <div className="bg-stone-100 p-4 rounded-2xl border-2 border-stone-300 shadow-inner overflow-x-auto">
      {/* Outer building wall */}
      <div
        className="relative bg-[#f0ebe3] border-4 border-[#2d2d2d] rounded-lg shadow-lg"
        style={{ width: '100%', minWidth: '800px', aspectRatio: '1.45 / 1' }}
      >
        {/* Inner padding container */}
        <div className="absolute inset-0" style={{ padding: '1.2%' }}>
          <div className="relative w-full h-full">

            {/* ── Corredor central (faixa vertical) ── */}
            <div
              style={{
                ...corridorStyle,
                left: '46%', top: '1%', width: '8%', height: '91%',
                borderLeft: '3px solid #94a3b8',
                borderRight: '3px solid #94a3b8',
                backgroundColor: '#e8e0d8',
              }}
            >
              <span className="text-[#94a3b8] text-[10px] font-semibold tracking-[0.3em] uppercase"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                Corredor
              </span>
            </div>

            {/* ── Corredor lateral esquerdo (entre WCs/Sala4 e Sala3) ── */}
            <div
              style={{
                ...corridorStyle,
                left: '25%', top: '1%', width: '20%', height: '19%',
                backgroundColor: '#e8e0d8',
                borderBottom: '3px solid #94a3b8',
              }}
            />

            {/* ── Corredor superior (acesso Sala5/6 pelo topo) ── */}
            <div
              style={{
                ...corridorStyle,
                left: '54%', top: '1%', width: '45%', height: '5%',
                backgroundColor: '#e8e0d8',
                borderBottom: '3px solid #94a3b8',
              }}
            />

            {/* ══ SALAS INTERATIVAS ══ */}

            {/* Sala 4 — Superior esquerdo */}
            <div style={{ position: 'absolute', left: '1%', top: '1%', width: '23%', height: '45%', zIndex: 1 }}>
              <RoomBlock
                room={getRoom('sala-4')}
                isSelected={selectedRoomId === 'sala-4'}
                onClick={onRoomSelect}
                className="w-full h-full"
              />
            </div>

            {/* WC 1 — Topo centro-esquerdo */}
            <div style={{ position: 'absolute', left: '25%', top: '1%', width: '10%', height: '18%', zIndex: 1 }}>
              <RoomBlock
                room={{ roomId: 'wc1', roomName: 'WC 1', status: 'livre', serviceType: '' }}
                isSelected={false}
                onClick={() => {}}
                isWC
                className="w-full h-full"
              />
            </div>

            {/* WC 2 — Topo centro, à direita do WC1 */}
            <div style={{ position: 'absolute', left: '36%', top: '1%', width: '10%', height: '18%', zIndex: 1 }}>
              <RoomBlock
                room={{ roomId: 'wc2', roomName: 'WC 2', status: 'livre', serviceType: '' }}
                isSelected={false}
                onClick={() => {}}
                isWC
                className="w-full h-full"
              />
            </div>

            {/* Sala 3 — Centro esquerdo, abaixo dos WCs */}
            <div style={{ position: 'absolute', left: '25%', top: '20%', width: '20%', height: '28%', zIndex: 1 }}>
              <RoomBlock
                room={getRoom('sala-3')}
                isSelected={selectedRoomId === 'sala-3'}
                onClick={onRoomSelect}
                className="w-full h-full"
              />
            </div>

            {/* Sala 5 — Superior direito, porta para o corredor superior */}
            <div style={{ position: 'absolute', left: '55%', top: '6%', width: '22%', height: '42%', zIndex: 1 }}>
              <RoomBlock
                room={getRoom('sala-5')}
                isSelected={selectedRoomId === 'sala-5'}
                onClick={onRoomSelect}
                className="w-full h-full"
              />
            </div>

            {/* Sala 6 — Extremo direito superior, porta para o corredor superior */}
            <div style={{ position: 'absolute', left: '78%', top: '6%', width: '21%', height: '42%', zIndex: 1 }}>
              <RoomBlock
                room={getRoom('sala-6')}
                isSelected={selectedRoomId === 'sala-6'}
                onClick={onRoomSelect}
                className="w-full h-full"
              />
            </div>

            {/* Sala 1 — Inferior esquerdo */}
            <div style={{ position: 'absolute', left: '1%', top: '47%', width: '23%', height: '48%', zIndex: 1 }}>
              <RoomBlock
                room={getRoom('sala-1')}
                isSelected={selectedRoomId === 'sala-1'}
                onClick={onRoomSelect}
                className="w-full h-full"
              />
            </div>

            {/* Receção — Centro inferior */}
            <div style={{ position: 'absolute', left: '25%', top: '50%', width: '20%', height: '45%', zIndex: 1 }}>
              <div className="w-full h-full border-2 border-dashed border-slate-300 rounded-lg bg-white/70 flex flex-col items-start justify-start p-3">
                <span className="font-bold text-slate-500 tracking-widest uppercase text-sm">Receção</span>
                {/* Balcão em L estilizado */}
                <div className="mt-auto w-full flex flex-col items-end gap-1">
                  <div className="bg-stone-300 rounded-sm" style={{ width: '55%', height: '10px' }} />
                  <div className="bg-stone-300 rounded-sm self-end" style={{ width: '20%', height: '30px' }} />
                </div>
              </div>
            </div>

            {/* Sala 2 — Inferior direito */}
            <div style={{ position: 'absolute', left: '55%', top: '50%', width: '44%', height: '45%', zIndex: 1 }}>
              <RoomBlock
                room={getRoom('sala-2')}
                isSelected={selectedRoomId === 'sala-2'}
                onClick={onRoomSelect}
                className="w-full h-full"
              />
            </div>

            {/* Entrada — Baixo ao centro, sob a Receção */}
            <div style={{ position: 'absolute', left: '30%', top: '96%', width: '15%', height: '3%', zIndex: 2 }}>
              <div className="w-full h-full bg-amber-100 border border-amber-300 rounded flex items-center justify-center">
                <span className="text-amber-700 font-bold text-[9px] tracking-widest uppercase">Entrada</span>
              </div>
            </div>

            {/* Marcadores de porta — decorativos */}
            {/* Porta Sala 1 (virada para a receção) */}
            <div style={{ position: 'absolute', left: '23.5%', top: '65%', width: '1.5%', height: '8%', zIndex: 3 }}
              className="flex items-center justify-center">
              <div className="w-0.5 h-full bg-[#2d2d2d]" />
            </div>
            {/* Porta Sala 2 (virada para a receção) */}
            <div style={{ position: 'absolute', left: '54%', top: '65%', width: '1.5%', height: '8%', zIndex: 3 }}
              className="flex items-center justify-center">
              <div className="w-0.5 h-full bg-[#2d2d2d]" />
            </div>
            {/* Porta Sala 3 (virada para o corredor central) */}
            <div style={{ position: 'absolute', left: '44.5%', top: '28%', width: '1.5%', height: '7%', zIndex: 3 }}
              className="flex items-center justify-center">
              <div className="w-0.5 h-full bg-[#2d2d2d]" />
            </div>
            {/* Porta Sala 4 (virada para o corredor lateral) */}
            <div style={{ position: 'absolute', left: '24%', top: '30%', width: '1.5%', height: '7%', zIndex: 3 }}
              className="flex items-center justify-center">
              <div className="w-0.5 h-full bg-[#2d2d2d]" />
            </div>
            {/* Porta Sala 5 (virada para cima/corredor superior) */}
            <div style={{ position: 'absolute', left: '60%', top: '4.5%', width: '8%', height: '1.5%', zIndex: 3 }}
              className="flex items-center justify-center">
              <div className="h-0.5 w-full bg-[#2d2d2d]" />
            </div>
            {/* Porta Sala 6 (virada para cima/corredor superior) */}
            <div style={{ position: 'absolute', left: '82%', top: '4.5%', width: '8%', height: '1.5%', zIndex: 3 }}
              className="flex items-center justify-center">
              <div className="h-0.5 w-full bg-[#2d2d2d]" />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
