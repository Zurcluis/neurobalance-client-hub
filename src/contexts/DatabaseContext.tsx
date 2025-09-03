import { createContext, useContext, useState, ReactNode } from 'react';

type DatabaseStatus = 'online' | 'offline';

interface DatabaseContextType {
  status: DatabaseStatus;
  setStatus: (status: DatabaseStatus, password?: string) => Promise<boolean>;
  isLoading: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

const MANAGEMENT_PASSWORD = import.meta.env.VITE_MANAGEMENT_PASSWORD || 'supersecret';

export const DatabaseProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatusState] = useState<DatabaseStatus>('online');
  const [isLoading, setIsLoading] = useState(false);

  const setStatus = async (newStatus: DatabaseStatus, password?: string): Promise<boolean> => {
    setIsLoading(true);

    if (process.env.NODE_ENV !== 'development') {
        console.warn('Database management is only available in development mode.');
        setIsLoading(false);
        return false;
    }

    if (password !== MANAGEMENT_PASSWORD) {
      console.error('Incorrect management password.');
      setIsLoading(false);
      return false;
    }

    // Simular uma pequena espera para a operação
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setStatusState(newStatus);
    setIsLoading(false);
    console.log(`Database status changed to: ${newStatus}`);
    return true;
  };

  return (
    <DatabaseContext.Provider value={{ status, setStatus, isLoading }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
