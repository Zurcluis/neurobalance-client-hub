import React from 'react';
import { Session } from '@/types/client';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SessionHistoryProps {
  sessions: Session[];
  selectedSessionId?: string;
  onSelectSession: (sessionId: string) => void;
}

const SessionHistory = ({ sessions, selectedSessionId, onSelectSession }: SessionHistoryProps) => {
  if (!sessions || sessions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Histórico de Sessões</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            Nenhuma sessão encontrada para este cliente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Histórico de Sessões</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {sessions.map((session) => (
              <div 
                key={session.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedSessionId === session.id 
                    ? 'bg-primary/10 border-primary/50' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">
                      {format(parseISO(session.date), 'dd/MM/yyyy')}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format(parseISO(session.date), 'HH:mm')}
                    </p>
                  </div>
                  <Badge variant={session.paid ? "default" : "outline"}>
                    {session.paid ? "Pago" : "Pendente"}
                  </Badge>
                </div>
                
                {session.terapeuta && (
                  <div className="text-sm mb-2">
                    <span className="font-medium">Terapeuta:</span> {session.terapeuta}
                  </div>
                )}
                
                {session.notes && (
                  <div className="mt-2 text-sm line-clamp-2">
                    <span className="font-medium">Notas:</span> {session.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SessionHistory; 