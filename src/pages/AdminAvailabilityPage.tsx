import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, BarChart3, Sparkles, Users } from 'lucide-react';
import { AdminAvailabilityDashboard } from '@/components/admin/availability/AdminAvailabilityDashboard';
import { AvailabilityAnalytics } from '@/components/admin/availability/AvailabilityAnalytics';
import { BulkSuggestionsGenerator } from '@/components/admin/availability/BulkSuggestionsGenerator';

const AdminAvailabilityPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#3f9094] to-[#2A5854] bg-clip-text text-transparent">
            Gestão de Disponibilidades
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gerencie disponibilidades de clientes, gere sugestões automáticas e visualize analytics
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto md:h-10">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Bulk Generator</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendário</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <AdminAvailabilityDashboard />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <AvailabilityAnalytics />
          </TabsContent>

          {/* Bulk Generator Tab */}
          <TabsContent value="bulk" className="space-y-6 mt-6">
            <BulkSuggestionsGenerator />
          </TabsContent>

          {/* Calendar Tab (Placeholder) */}
          <TabsContent value="calendar" className="space-y-6 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg p-12 text-center border-2 border-dashed border-blue-300 dark:border-blue-700">
              <Calendar className="h-16 w-16 mx-auto text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                Calendário Unificado
              </h3>
              <p className="text-blue-800 dark:text-blue-200 max-w-lg mx-auto">
                Em breve: Visualize todas as disponibilidades e sugestões de todos os clientes em
                um calendário interativo unificado.
              </p>
              <div className="mt-6 flex items-center justify-center gap-4 text-sm text-blue-700 dark:text-blue-300">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Disponível</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Sugestão Pendente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span>Agendamento Confirmado</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default AdminAvailabilityPage;

