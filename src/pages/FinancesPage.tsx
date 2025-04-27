
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import FinancialReport from '@/components/finances/FinancialReport';

const FinancesPage = () => {
  return (
    <PageLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-heading">Financial Reports</h1>
        <p className="text-neuro-gray mt-2">Track revenue and payments from clients</p>
      </div>
      
      <FinancialReport />
    </PageLayout>
  );
};

export default FinancesPage;
