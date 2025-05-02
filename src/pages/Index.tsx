
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import DashboardOverview from '@/components/dashboard/DashboardOverview';

const Index = () => {
  return (
    <PageLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#3A726D]">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Welcome to NeuroBalance Client Management System</p>
      </div>
      
      <DashboardOverview />
    </PageLayout>
  );
};

export default Index;
