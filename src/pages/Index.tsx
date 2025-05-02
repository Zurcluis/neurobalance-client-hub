
import React, { useEffect, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import { Link } from 'react-router-dom';
import UpcomingAppointmentsTable from '@/components/dashboard/UpcomingAppointmentsTable';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Load appointments from localStorage
    const loadAppointments = () => {
      const savedAppointments = localStorage.getItem('appointments');
      return savedAppointments ? JSON.parse(savedAppointments) : [];
    };

    const appointments = loadAppointments();
    const today = new Date();
    
    // Filter upcoming appointments (future appointments excluding today)
    const future = appointments.filter((app: any) => {
      const appDate = new Date(app.date);
      return appDate > today;
    });

    // Sort by date, closest first
    future.sort((a: any, b: any) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Take only the next 5 appointments
    setUpcomingAppointments(future.slice(0, 5));
  }, []);

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
