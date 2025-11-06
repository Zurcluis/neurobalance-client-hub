import { createContext, useContext, useState, ReactNode } from 'react';
import { logger } from '@/lib/logger';

type DatabaseStatus = 'online' | 'offline';

interface DatabaseContextType {
  status: DatabaseStatus;
  setStatus: (status: DatabaseStatus) => Promise<boolean>;
  isLoading: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatusState] = useState<DatabaseStatus>('online');
  const [isLoading, setIsLoading] = useState(false);

  const setStatus = async (newStatus: DatabaseStatus): Promise<boolean> => {
    setIsLoading(true);

    if (!import.meta.env.DEV) {
        logger.warn('Database management is only available in development mode.');
        setIsLoading(false);
        return false;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    
    setStatusState(newStatus);
    setIsLoading(false);
    logger.log(`Database status changed to: ${newStatus}`);
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
