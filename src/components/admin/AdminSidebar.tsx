import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Users, Home, Menu, X, LogOut, Settings, User, Shield, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Drawer, 
  DrawerContent, 
  DrawerTrigger,
  DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from 'sonner';
import { ADMIN_PERMISSIONS } from '@/types/admin';

const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { session, logout, hasPermission } = useAdminAuth();

  const handleLogout = async () => {
    try {
      logout();
      toast.success('Logout realizado com sucesso');
      navigate('/admin-login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const menuItems = [
    { 
      name: 'Clientes', 
      icon: <Users className={isMobile ? "h-6 w-6" : "h-5 w-5"} />, 
      path: '/admin/clients',
      permission: ADMIN_PERMISSIONS.VIEW_CLIENTS
    },
    { 
      name: 'Calendário', 
      icon: <Calendar className={isMobile ? "h-6 w-6" : "h-5 w-5"} />, 
      path: '/admin/calendar',
      permission: ADMIN_PERMISSIONS.VIEW_CALENDAR
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800 text-xs">Admin</Badge>;
      case 'assistant':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Assistente</Badge>;
      default:
        return null;
    }
  };

  const renderSidebarContent = () => (
    <div className={`p-4 flex flex-col h-full ${isMobile ? 'pt-safe mobile-menu-content' : ''}`}>
      {isMobile && (
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-slate-600 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Admin</h2>
              <p className="text-xs text-slate-600">NeuroBalance</p>
            </div>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
              <X className="h-5 w-5" />
            </Button>
          </DrawerClose>
        </div>
      )}

      {!isMobile && (
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png" 
            alt="NeuroBalance Logo" 
            className={cn(
              "mb-4 transition-all duration-300",
              isCollapsed ? "w-10" : "w-28" 
            )} 
          />
          {!isCollapsed && (
            <div className="text-center">
              <h1 className="font-bold text-lg text-[#3A726D]">NeuroBalance</h1>
              <p className="text-xs text-gray-600">Área Administrativa</p>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-4 w-full flex items-center justify-center hover:bg-gray-100" 
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Informações do Admin Logado */}
      {session && (
        <div className={cn(
          "mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200",
          isCollapsed && !isMobile && "p-2"
        )}>
          <div className="flex items-center gap-3">
            <div className="bg-[#3f9094] p-2 rounded-full flex-shrink-0">
              <User className="h-4 w-4 text-white" />
            </div>
            {(!isCollapsed || isMobile) && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.adminName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {getRoleBadge(session.role)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <nav className="flex-1">
        <ul className={cn(
          "space-y-1",
          isMobile && "space-y-2"
        )}>
          {filteredMenuItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={cn(
                  'flex items-center rounded-lg py-3 px-3 text-sm font-medium transition-colors hover:bg-gray-100',
                  isMobile && "text-base py-3.5 px-4",
                  location.pathname === item.path
                    ? 'bg-[#3f9094] text-white hover:bg-[#2d7a7e]'
                    : 'text-gray-700 hover:text-gray-900',
                  isCollapsed && !isMobile ? 'justify-center px-2' : 'justify-start'
                )}
                onClick={() => isMobile && document.querySelector('.drawer-close')?.dispatchEvent(new Event('click'))}
              >
                <span className={isMobile ? "text-xl" : "text-lg"}>{item.icon}</span>
                {(!isCollapsed || isMobile) && <span className={cn("ml-3", isMobile && "font-medium")}>{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto space-y-2">
        {(!isCollapsed || isMobile) && (
          <>
            <div className="text-xs text-center text-gray-500">
              <p>NeuroBalance Admin</p>
              <p className="mt-1">v1.0.0</p>
            </div>
            
            <Button
              variant="ghost"
              className="w-full flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </>
        )}
        
        {isCollapsed && !isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed top-0 left-0 z-40 w-full bg-white/90 backdrop-blur-sm border-b border-gray-200 flex justify-between items-center px-4 py-3 pt-safe">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-11 w-11 flex items-center justify-center">
              <Menu className="h-6 w-6" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[95vh] rounded-t-xl border-t-0">
            {renderSidebarContent()}
          </DrawerContent>
        </Drawer>
        
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png" 
            alt="NeuroBalance Logo" 
            className="h-8 w-auto"
          />
          <span className="font-semibold text-gray-900">Admin</span>
        </div>
        
        <div className="w-11" /> {/* Spacer for centering */}
      </div>
    );
  }

  return (
    <div className={cn(
      'fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-40 transition-all duration-300 shadow-lg overflow-y-auto',
      isCollapsed ? 'w-20' : 'w-64',
    )}>
      {renderSidebarContent()}
    </div>
  );
};

export default AdminSidebar;
