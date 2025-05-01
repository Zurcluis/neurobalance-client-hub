
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface GoogleCalendarSyncProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GoogleCalendarSync = ({ open, onOpenChange }: GoogleCalendarSyncProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = () => {
    setIsLoading(true);
    
    // Simulating connection to Google Calendar
    setTimeout(() => {
      setIsConnected(true);
      setIsLoading(false);
      localStorage.setItem('googleCalendarConnected', 'true');
      toast.success('Conectado ao Google Calendar com sucesso');
    }, 1500);
  };
  
  const handleDisconnect = () => {
    setIsLoading(true);
    
    // Simulating disconnection from Google Calendar
    setTimeout(() => {
      setIsConnected(false);
      setIsLoading(false);
      localStorage.removeItem('googleCalendarConnected');
      toast.success('Desconectado do Google Calendar');
    }, 1000);
  };
  
  // Check if already connected
  React.useEffect(() => {
    const connected = localStorage.getItem('googleCalendarConnected');
    if (connected === 'true') {
      setIsConnected(true);
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sincronizar com Google Calendar</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {isConnected ? (
            <>
              <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
                Sua conta está conectada ao Google Calendar
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Opções de sincronização</h3>
                <div className="flex items-center justify-between border-b pb-2">
                  <span>Sincronizar automaticamente</span>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span>Notificação de conflitos</span>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Eventos de dois sentidos</span>
                  <input type="checkbox" className="h-4 w-4" />
                </div>
              </div>
              
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={isLoading}
                >
                  Desconectar
                </Button>
                
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    toast.success('Configurações salvas');
                  }}
                  className="bg-[#3f9094] hover:bg-[#265255]"
                >
                  Salvar Configurações
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Conecte-se ao Google Calendar para sincronizar seus agendamentos entre o NeuroBalance e o seu Google Calendar.
              </p>
              
              <div className="bg-gray-50 border rounded-md p-4">
                <h3 className="font-medium mb-2">Ao conectar você poderá:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Ver seus agendamentos do NeuroBalance no Google Calendar</li>
                  <li>Receber notificações de agendamentos</li>
                  <li>Sincronização automática de alterações</li>
                </ul>
              </div>
              
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="bg-[#3f9094] hover:bg-[#265255]"
                >
                  {isLoading ? 'Conectando...' : 'Conectar com Google Calendar'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoogleCalendarSync;
