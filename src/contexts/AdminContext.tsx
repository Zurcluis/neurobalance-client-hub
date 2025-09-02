import React, { createContext, useContext, ReactNode } from 'react';

interface AdminContextType {
  isAdminContext: boolean;
}

const AdminContext = createContext<AdminContextType>({ isAdminContext: false });

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  return context;
};

interface AdminContextProviderProps {
  children: ReactNode;
  isAdminContext?: boolean;
}

export const AdminContextProvider = ({ 
  children, 
  isAdminContext = false 
}: AdminContextProviderProps) => {
  return (
    <AdminContext.Provider value={{ isAdminContext }}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContext;
