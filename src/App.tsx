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
import NotFound from "./pages/NotFound";
import MonitoringPage from "./pages/MonitoringPage";
import LoginPage from "./pages/LoginPage";
import AuthCallback from "./pages/AuthCallback";
import ClientLoginPage from "./pages/ClientLoginPage";
import ClientDashboardPage from "./pages/ClientDashboardPage";
import { ThemeProvider } from "./hooks/use-theme";
import { LanguageProvider } from "./hooks/use-language";
import { AuthProvider } from "./contexts/AuthContext";
import { ClientAuthProvider } from "./hooks/useClientAuth";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <LanguageProvider>
        <AuthProvider>
          <ClientAuthProvider>
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
                  
                  {/* Client Routes */}
                  <Route path="/client-login" element={<ClientLoginPage />} />
                  <Route path="/client-dashboard" element={<ClientDashboardPage />} />
                  
                  {/* 404 Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ClientAuthProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
