import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ClientsPage from "./pages/ClientsPage";
import ClientDetailPage from "./pages/ClientDetailPage";
import CalendarPage from "./pages/CalendarPage";
import FinancesPage from "./pages/FinancesPage";
import StatisticsPage from "./pages/StatisticsPage";
import InvestmentsPage from "./pages/InvestmentsPage";
import MarketingReportsPage from "./pages/MarketingReportsPage";
import LeadCompraPage from "./pages/LeadCompraPage";
import NotFound from "./pages/NotFound";
import MonitoringPage from "./pages/MonitoringPage";
import LoginPage from "./pages/LoginPage";
import AuthCallback from "./pages/AuthCallback";
import ClientLoginPage from "./pages/ClientLoginPage";
import ClientDashboardPage from "./pages/ClientDashboardPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminClientsFullPage from "./pages/AdminClientsFullPage";
import AdminClientProfilePage from "./pages/AdminClientProfilePage";
import AdminCalendarFullPage from "./pages/AdminCalendarFullPage";
import AdminManagementPage from "./pages/AdminManagementPage";
import { ThemeProvider } from "./hooks/use-theme";
import { LanguageProvider } from "./hooks/use-language";
import { AuthProvider } from "./contexts/AuthContext";
import { ClientAuthProvider } from "./hooks/useClientAuth";
import { AdminAuthProvider } from "./hooks/useAdminAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import { AdminProtectedRoute } from "./components/admin/AdminProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <LanguageProvider>
        <AuthProvider>
          <ClientAuthProvider>
            <AdminAuthProvider>
              <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Admin Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/clients"
                    element={
                      <ProtectedRoute>
                        <ClientsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/clients/:clientId"
                    element={
                      <ProtectedRoute>
                        <ClientDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/calendar"
                    element={
                      <ProtectedRoute>
                        <CalendarPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/monitoring"
                    element={
                      <ProtectedRoute>
                        <MonitoringPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/finances"
                    element={
                      <ProtectedRoute>
                        <FinancesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/statistics"
                    element={
                      <ProtectedRoute>
                        <StatisticsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/investments"
                    element={
                      <ProtectedRoute>
                        <InvestmentsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/marketing-reports"
                    element={
                      <ProtectedRoute>
                        <MarketingReportsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/lead-compra"
                    element={
                      <ProtectedRoute>
                        <LeadCompraPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin-management"
                    element={
                      <ProtectedRoute>
                        <AdminManagementPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Admin Routes */}
                  <Route path="/admin-login" element={<AdminLoginPage />} />
                                                <Route
              path="/admin/clients"
              element={
                <AdminProtectedRoute requiredPermission="view_clients">
                  <AdminClientsFullPage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/clients/:clientId"
              element={
                <AdminProtectedRoute requiredPermission="view_clients">
                  <AdminClientProfilePage />
                </AdminProtectedRoute>
              }
            />
                                    <Route 
                    path="/admin/calendar" 
                    element={
                      <AdminProtectedRoute requiredPermission="view_calendar">
                        <AdminCalendarFullPage />
                      </AdminProtectedRoute>
                    } 
                  />
                  
                  {/* Client Routes */}
                  <Route path="/client-login" element={<ClientLoginPage />} />
                  <Route path="/client-dashboard" element={<ClientDashboardPage />} />
                  
                  {/* 404 Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
              </TooltipProvider>
            </AdminAuthProvider>
          </ClientAuthProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
