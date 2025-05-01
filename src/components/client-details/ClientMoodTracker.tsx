
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ClientMood } from '@/types/client';

interface ClientMoodTrackerProps {
  clientId: string;
  onSubmitMood: (mood: ClientMood) => void;
  moods: ClientMood[];
}

const moodOptions = [
  { value: 'happy', label: 'Bem disposto' },
  { value: 'tired', label: 'Cansado' },
  { value: 'sleepy', label: 'Com sono' },
  { value: 'angry', label: 'Irritado' },
  { value: 'anxious', label: 'Ansioso' },
  { value: 'relaxed', label: 'Relaxado' },
  { value: 'sad', label: 'Triste' },
  { value: 'stressed', label: 'Stressado' },
];

const sleepOptions = [
  { value: 'good', label: 'Bem' },
  { value: 'average', label: 'Razoável' },
  { value: 'bad', label: 'Mal' }
];

const ClientMoodTracker = ({ clientId, onSubmitMood, moods }: ClientMoodTrackerProps) => {
  const [currentMood, setCurrentMood] = useState<string>('');
  const [sleepQuality, setSleepQuality] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentMood) {
      toast.error('Por favor selecione o seu estado emocional');
      return;
    }
    
    const newMood: ClientMood = {
      id: Date.now().toString(),
      clientId,
      mood: currentMood,
      sleepQuality,
      notes,
      date: new Date().toISOString(),
    };
    
    onSubmitMood(newMood);
    
    // Reset form
    setCurrentMood('');
    setSleepQuality('');
    setNotes('');
    
    toast.success('Estado emocional registado com sucesso');
  };

  // Sort moods by date (newest first)
  const sortedMoods = [...moods].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="glassmorphism">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Registar Estado Emocional</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Estado Emocional</label>
              <Select value={currentMood} onValueChange={setCurrentMood}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o seu estado" />
                </SelectTrigger>
                <SelectContent>
                  {moodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Qualidade do Sono</label>
              <Select value={sleepQuality} onValueChange={setSleepQuality}>
                <SelectTrigger>
                  <SelectValue placeholder="Como dormiu?" />
                </SelectTrigger>
                <SelectContent>
                  {sleepOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Observações</label>
              <Textarea
                placeholder="Notas adicionais sobre o estado emocional"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-[#3f9094] hover:bg-[#265255]"
            >
              Registar
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card className="glassmorphism">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Histórico de Estados Emocionais</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedMoods.length > 0 ? (
            <div className="space-y-3">
              {sortedMoods.map((mood) => {
                const moodLabel = moodOptions.find(m => m.value === mood.mood)?.label || mood.mood;
                const sleepLabel = sleepOptions.find(s => s.value === mood.sleepQuality)?.label || mood.sleepQuality;
                
                return (
                  <div 
                    key={mood.id} 
                    className="p-3 border rounded-lg bg-[#c5cfce]/10"
                  >
                    <div className="flex justify-between mb-1">
                      <div className="font-medium">{moodLabel}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(mood.date).toLocaleDateString('pt-PT')}
                      </div>
                    </div>
                    
                    {mood.sleepQuality && (
                      <div className="text-sm">
                        <span className="text-gray-600">Sono:</span> {sleepLabel}
                      </div>
                    )}
                    
                    {mood.notes && (
                      <div className="text-sm mt-1 text-gray-700">
                        {mood.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-gray-500">
              Nenhum registo de estado emocional
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientMoodTracker;
