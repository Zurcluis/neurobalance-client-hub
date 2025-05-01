
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, User, BarChart3, Home, Menu, X, MessageSquare, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Drawer, 
  DrawerContent, 
  DrawerTrigger,
  DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import CommunicationsPanel from '@/components/communications/CommunicationsPanel';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCommunications, setShowCommunications] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();

  const menuItems = [
    { name: 'Dashboard', icon: <Home />, path: '/' },
    { name: 'Clientes', icon: <User />, path: '/clients' },
    { name: 'Calendário', icon: <Calendar />, path: '/calendar' },
    { name: 'Finanças', icon: <BarChart3 />, path: '/finances' },
  ];
  
  const communicationItems = [
    { name: 'Mensagens', icon: <MessageSquare />, action: () => setShowCommunications(true), type: 'sms' },
    { name: 'Email', icon: <Mail />, action: () => setShowCommunications(true), type: 'email' },
    { name: 'Chamada', icon: <Phone />, action: () => setShowCommunications(true), type: 'call' },
  ];

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-between mb-8">
        {!isCollapsed ? (
          <div className="flex flex-col items-center">
            <img 
              src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png" 
              alt="NeuroBalance Logo" 
              className="h-32 w-auto mb-2" // Logo size doubled again (from 16 to 32)
            />
            <h1 className="text-xl font-bold gradient-heading">
              NeuroBalance
            </h1>
          </div>
        ) : (
          <img 
            src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png" 
            alt="NeuroBalance Logo" 
            className="h-24 w-auto mx-auto" // Logo size doubled (from 12 to 24)
          />
        )}
        {!isMobile && (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-[#c5cfce] transition-colors"
          >
            {isCollapsed ? <Menu /> : <X />}
          </button>
        )}
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={cn(
                  'flex items-center p-3 rounded-lg transition-all duration-200',
                  location.pathname === item.path
                    ? 'bg-[#3f9094] text-white shadow-md'
                    : 'hover:bg-[#c5cfce]',
                  isCollapsed && !isMobile ? 'justify-center' : 'justify-start'
                )}
              >
                <span className="text-xl">{item.icon}</span>
                {(!isCollapsed || isMobile) && <span className="ml-3">{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
        
        {/* Communication section */}
        <div className="mt-8">
          <h3 className={cn(
            'text-[#265255] font-medium mb-2',
            isCollapsed && !isMobile ? 'text-center text-xs' : 'px-3'
          )}>
            {(!isCollapsed || isMobile) ? 'Comunicações' : 'Com.'}
          </h3>
          <ul className="space-y-2">
            {communicationItems.map((item) => (
              <li key={item.name}>
                <button
                  onClick={() => {
                    setShowCommunications(true);
                    localStorage.setItem('communicationType', item.type);
                  }}
                  className={cn(
                    'w-full flex items-center p-3 rounded-lg transition-all duration-200 hover:bg-[#c5cfce]',
                    isCollapsed && !isMobile ? 'justify-center' : 'justify-start'
                  )}
                >
                  <span className="text-xl">{item.icon}</span>
                  {(!isCollapsed || isMobile) && <span className="ml-3">{item.name}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="pt-4">
        {(!isCollapsed || isMobile) && (
          <div className="text-xs text-center text-gray-600">
            <p>NeuroBalance Clinic</p>
            <p className="mt-1">Sistema de Gestão de Clientes</p>
          </div>
        )}
      </div>
      
      {/* Fixed: Moved the Drawer component outside and only use DrawerContent inside */}
      <Drawer open={showCommunications} onOpenChange={setShowCommunications}>
        <DrawerContent>
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Comunicações</h2>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
            <CommunicationsPanel onClose={() => setShowCommunications(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed top-0 left-0 z-10 w-full bg-white/90 backdrop-blur-sm border-b border-gray-200 flex justify-between items-center px-4 py-3">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[90vh]">
            {renderSidebarContent()}
          </DrawerContent>
        </Drawer>
        
        <img 
          src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png" 
          alt="NeuroBalance Logo" 
          className="h-12 w-auto"
        />
        
        <div className="w-10"></div> {/* Placeholder for balance */}
      </div>
    );
  }

  return (
    <div className={cn(
      'fixed top-0 left-0 h-screen glassmorphism z-10 transition-all duration-300',
      isCollapsed ? 'w-20' : 'w-64',
    )}>
      {renderSidebarContent()}
    </div>
  );
};

export default Sidebar;
