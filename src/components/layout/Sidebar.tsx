import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, User, BarChart3, Home, Menu, X, MessageSquare, Mail, Phone, Search, PieChart, LayoutDashboard, Users, DollarSign, BarChart2, Settings, LogOut, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile, useScreenSize } from '@/hooks/use-mobile';
import { 
  Drawer, 
  DrawerContent, 
  DrawerTrigger,
  DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import CommunicationsPanel from '@/components/communications/CommunicationsPanel';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LanguageSwitch } from '@/components/language/LanguageSwitch';
import { useLanguage } from '@/hooks/use-language';
import SearchDialog from '@/components/search/SearchDialog';
import GoogleCalendarSync from '@/components/calendar/GoogleCalendarSync';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCommunications, setShowCommunications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCalendarSync, setShowCalendarSync] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isPortrait } = useScreenSize();
  const { t } = useLanguage();
  
  // Get communication type from localStorage if exists
  useEffect(() => {
    const commType = localStorage.getItem('communicationType');
    if (commType) {
      localStorage.removeItem('communicationType');
    }
  }, []);

  const menuItems = [
    { name: t('dashboard'), icon: <Home className={isMobile ? "h-6 w-6" : "h-5 w-5"} />, path: '/' },
    { name: t('clients'), icon: <User className={isMobile ? "h-6 w-6" : "h-5 w-5"} />, path: '/clients' },
    { name: t('calendar'), icon: <Calendar className={isMobile ? "h-6 w-6" : "h-5 w-5"} />, path: '/calendar' },
    { name: t('finances'), icon: <BarChart3 className={isMobile ? "h-6 w-6" : "h-5 w-5"} />, path: '/finances' },
    { name: 'Estatísticas', icon: <PieChart className={isMobile ? "h-6 w-6" : "h-5 w-5"} />, path: '/statistics' },
    { name: 'Monitorização', icon: <Activity className={isMobile ? "h-6 w-6" : "h-5 w-5"} />, path: '/monitoring' },
  ];
  
  const communicationItems = [
    { name: t('messages'), icon: <MessageSquare className={isMobile ? "h-6 w-6" : "h-5 w-5"} />, action: () => setShowCommunications(true), type: 'sms' },
    { name: t('email'), icon: <Mail className={isMobile ? "h-6 w-6" : "h-5 w-5"} />, action: () => setShowCommunications(true), type: 'email' },
    { name: t('call'), icon: <Phone className={isMobile ? "h-6 w-6" : "h-5 w-5"} />, action: () => setShowCommunications(true), type: 'call' },
  ];

  const renderSidebarContent = () => (
    <div className={`p-4 flex flex-col h-full ${isMobile ? 'pt-safe mobile-menu-content' : ''}`}>
      {isMobile && (
        <div className="flex justify-between items-center mb-6">
            <img 
              src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png" 
              alt="NeuroBalance Logo" 
            className="h-10 w-auto app-logo"
          />
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
              "app-logo mb-4 transition-all duration-300",
              isCollapsed ? "w-10" : "w-28" 
            )} 
          />
          {!isCollapsed && (
            <div className="text-center">
              <h1 className="font-bold text-lg text-[#3A726D] dark:text-[#E6ECEA]">NeuroBalance</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Client Management</p>
            </div>
        )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-4 w-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800" 
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <Menu /> : <ChevronLeftIcon className="h-5 w-5" />}
          </Button>
        </div>
        )}

      <div className="relative mb-8">
        <Button 
          variant="outline" 
          className="w-full relative text-left flex items-center justify-between pl-3 py-2 h-auto rounded-lg"
          onClick={() => setShowSearch(true)}
        >
          <span className={cn(
            "text-gray-500 dark:text-gray-400",
            isCollapsed && !isMobile ? "hidden" : "block"
          )}>
            Pesquisar...
          </span>
          <Search className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </Button>
      </div>

      <nav className="flex-1">
        <ul className={cn(
          "space-y-1",
          isMobile && "space-y-2"
        )}>
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={cn(
                  'sidebar-item',
                  'rounded-lg py-3',
                  isMobile && "text-base py-3.5 px-4",
                  location.pathname === item.path
                    ? 'sidebar-item-active'
                    : 'sidebar-item-inactive',
                  isCollapsed && !isMobile ? 'justify-center px-2' : 'justify-start px-3'
                )}
                onClick={() => isMobile && document.querySelector('.drawer-close')?.dispatchEvent(new Event('click'))}
              >
                <span className={isMobile ? "text-xl" : "text-lg"}>{item.icon}</span>
                {(!isCollapsed || isMobile) && <span className={cn("ml-3", isMobile && "font-medium")}>{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
        
        {/* Communication section */}
        <div className={cn("mt-8", isMobile && "mt-10")}>
          <h3 className={cn(
            'text-[#3A726D] dark:text-[#E6ECEA] font-medium mb-2',
            isMobile && "text-base px-4",
            isCollapsed && !isMobile ? 'text-center text-xs' : 'px-3'
          )}>
            {(!isCollapsed || isMobile) ? t('communications') : 'Com.'}
          </h3>
          <ul className={cn(
            "space-y-1",
            isMobile && "space-y-2"
          )}>
            {communicationItems.map((item) => (
              <li key={item.name}>
                <button
                  onClick={() => {
                    setShowCommunications(true);
                    localStorage.setItem('communicationType', item.type);
                  }}
                  className={cn(
                    'sidebar-item sidebar-item-inactive w-full rounded-lg py-3',
                    isMobile && "text-base py-3.5 px-4",
                    isCollapsed && !isMobile ? 'justify-center px-2' : 'justify-start px-3'
                  )}
                >
                  <span className={isMobile ? "text-xl" : "text-lg"}>{item.icon}</span>
                  {(!isCollapsed || isMobile) && <span className={cn("ml-3", isMobile && "font-medium")}>{item.name}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="pt-4 mt-auto">
        <div className="flex justify-between items-center px-2">
          <ThemeToggle />
          <LanguageSwitch />
          <button 
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg transition"
            onClick={() => setShowCalendarSync(true)}
          >
            <Calendar className="h-5 w-5" />
          </button>
        </div>
        
        {(!isCollapsed || isMobile) && (
          <div className="text-xs text-center text-gray-600 dark:text-gray-400 mt-4">
            <p>NeuroBalance Clinic</p>
            <p className="mt-1">{t('system')} v1.0.0</p>
          </div>
        )}
      </div>

      {/* Communications Panel Drawer */}
      <Drawer open={showCommunications} onOpenChange={setShowCommunications}>
        <DrawerContent className="max-h-[90vh] overflow-y-auto">
          <div className="p-4 pt-safe">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Comunicações</h2>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
            <CommunicationsPanel onClose={() => setShowCommunications(false)} />
          </div>
        </DrawerContent>
      </Drawer>
      
      {/* Search Dialog */}
      <SearchDialog open={showSearch} onOpenChange={setShowSearch} />
      
      {/* Google Calendar Sync Dialog */}
      <GoogleCalendarSync open={showCalendarSync} onOpenChange={setShowCalendarSync} />
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed top-0 left-0 z-40 w-full bg-white/90 dark:bg-[#1A1F2C]/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 flex justify-between items-center px-4 py-3 pt-safe">
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
        
        <img 
          src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png" 
          alt="NeuroBalance Logo" 
          className="h-8 w-auto app-logo" // Added app-logo class for dark mode fix
        />
        
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="rounded-full h-11 w-11 flex items-center justify-center" onClick={() => setShowSearch(true)}>
            <Search className="h-5 w-5" />
        </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'fixed top-0 left-0 h-screen bg-white dark:bg-[#1A1F2C] border-r border-gray-200 dark:border-gray-800 z-40 transition-all duration-300 shadow-md overflow-y-auto',
      isCollapsed ? 'w-20' : 'w-64',
    )}>
      {renderSidebarContent()}
    </div>
  );
};

// Ícone personalizado para o menu compacto
const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 18l-6-6 6-6"/>
  </svg>
);

export default Sidebar;
