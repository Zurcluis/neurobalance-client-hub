
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ClientDetailData } from '@/types/client';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'client' | 'appointment' | 'session' | 'payment';
  path: string;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SearchDialog = ({ open, onOpenChange }: SearchDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();
  
  React.useEffect(() => {
    if (open && searchQuery) {
      performSearch(searchQuery);
    } else {
      setResults([]);
    }
  }, [searchQuery, open]);

  const performSearch = (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    const q = query.toLowerCase();
    const searchResults: SearchResult[] = [];
    
    // Search clients
    const clients = JSON.parse(localStorage.getItem('clients') || '[]') as ClientDetailData[];
    
    clients.forEach(client => {
      if (
        client.name.toLowerCase().includes(q) || 
        client.email.toLowerCase().includes(q) ||
        client.phone.toLowerCase().includes(q)
      ) {
        searchResults.push({
          id: client.id,
          title: client.name,
          subtitle: client.email,
          type: 'client',
          path: `/clients/${client.id}`
        });
      }
    });
    
    // Search appointments
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    
    appointments.forEach((appointment: any) => {
      if (
        appointment.title?.toLowerCase().includes(q) ||
        appointment.description?.toLowerCase().includes(q)
      ) {
        // Find client name
        const client = clients.find(c => c.id === appointment.clientId);
        
        searchResults.push({
          id: appointment.id,
          title: appointment.title || 'Consulta',
          subtitle: client ? `Cliente: ${client.name}` : undefined,
          type: 'appointment',
          path: '/calendar'
        });
      }
    });
    
    setResults(searchResults);
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.path);
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {results.length > 0 ? (
            <ul className="space-y-1">
              {results.map((result) => (
                <li key={result.id}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => handleResultClick(result)}
                  >
                    <div>
                      <div className="font-medium">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-sm text-gray-500">{result.subtitle}</div>
                      )}
                    </div>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            searchQuery ? (
              <div className="py-4 text-center text-gray-500">
                Nenhum resultado encontrado
              </div>
            ) : (
              <div className="py-4 text-center text-gray-500">
                Digite para começar a pesquisar
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;
