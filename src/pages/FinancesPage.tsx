
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import FinancialReport from '@/components/finances/FinancialReport';
import EmptyFinanceState from '@/components/finances/EmptyFinanceState';
import { ClientData } from '@/components/clients/ClientCard';

const FinancesPage = () => {
  // Load clients from localStorage to check if there are any
  const loadClientsFromStorage = (): ClientData[] => {
    const storedClients = localStorage.getItem('clients');
    return storedClients ? JSON.parse(storedClients) : [];
  };
  
  const clients = loadClientsFromStorage();
  const hasClients = clients.length > 0;

  return (
    <PageLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-heading">Relatórios Financeiros</h1>
        <p className="text-neuro-gray mt-2">Acompanhe receitas e pagamentos dos clientes</p>
      </div>
      
      {hasClients ? <FinancialReport /> : <EmptyFinanceState />}
    </PageLayout>
  );
};

export default FinancesPage;
