import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./hooks/use-theme";
import { LanguageProvider } from "./hooks/use-language";
import { AuthProvider } from "./contexts/AuthContext";
import { DatabaseProvider } from "./contexts/DatabaseContext";
import { ClientAuthProvider } from "./hooks/useClientAuth";
import { AdminAuthProvider } from "./hooks/useAdminAuth";
import { MarketingAuthProvider } from "./hooks/useMarketingAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import { AdminProtectedRoute } from "./components/admin/AdminProtectedRoute";
import { MarketingProtectedRoute } from "./components/marketing/MarketingProtectedRoute";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import { SkipLinks } from "./components/accessibility/SkipLinks";

const Index = lazy(() => import("./pages/Index"));
const ClientsPage = lazy(() => import("./pages/ClientsPage"));
const ClientDetailPage = lazy(() => import("./pages/ClientDetailPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const FinancesPage = lazy(() => import("./pages/FinancesPage"));
const StatisticsPage = lazy(() => import("./pages/StatisticsPage"));
const InvestmentsPage = lazy(() => import("./pages/InvestmentsPage"));
const MarketingReportsPage = lazy(() => import("./pages/MarketingReportsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MonitoringPage = lazy(() => import("./pages/MonitoringPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const ClientLoginPage = lazy(() => import("./pages/ClientLoginPage"));
const ClientDashboardPage = lazy(() => import("./pages/ClientDashboardPage"));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));
const AdminClientsFullPage = lazy(() => import("./pages/AdminClientsFullPage"));
const AdminClientProfilePage = lazy(() => import("./pages/AdminClientProfilePage"));
const AdminCalendarFullPage = lazy(() => import("./pages/AdminCalendarFullPage"));
const AdminManagementPage = lazy(() => import("./pages/AdminManagementPage"));
const MarketingLoginPage = lazy(() => import("./pages/MarketingLoginPage"));
const MarketingAreaPage = lazy(() => import("./pages/MarketingAreaPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <AuthProvider>
            <DatabaseProvider>
              <ClientAuthProvider>
                <AdminAuthProvider>
                  <MarketingAuthProvider>
                    <TooltipProvider>
                      <Toaster />
                      <Sonner />
                      <BrowserRouter>
                        <SkipLinks />
                        <Suspense fallback={<LoadingFallback />}>
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
                  
                  {/* Marketing Routes */}
                  <Route path="/marketing-login" element={<MarketingLoginPage />} />
                  <Route
                    path="/marketing"
                    element={
                      <MarketingProtectedRoute>
                        <MarketingAreaPage />
                      </MarketingProtectedRoute>
                    }
                  />
                  
                  {/* Client Routes */}
                  <Route path="/client-login" element={<ClientLoginPage />} />
                  <Route path="/client-dashboard" element={<ClientDashboardPage />} />
                  
                            {/* 404 Route */}
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Suspense>
                      </BrowserRouter>
                    </TooltipProvider>
                  </MarketingAuthProvider>
                </AdminAuthProvider>
              </ClientAuthProvider>
            </DatabaseProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
