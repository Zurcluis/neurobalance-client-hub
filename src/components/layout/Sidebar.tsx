
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, User, BarChart3, Home, Menu, X, MessageSquare, Mail, Phone, Search, Moon, Sun } from 'lucide-react';
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
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LanguageSwitch } from '@/components/language/LanguageSwitch';
import { useLanguage } from '@/hooks/use-language';
import SearchDialog from '@/components/search/SearchDialog';
import GoogleCalendarSync from '@/components/calendar/GoogleCalendarSync';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCommunications, setShowCommunications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCalendarSync, setShowCalendarSync] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  
  // Get communication type from localStorage if exists
  React.useEffect(() => {
    const commType = localStorage.getItem('communicationType');
    if (commType) {
      localStorage.removeItem('communicationType');
    }
  }, []);

  const menuItems = [
    { name: t('dashboard'), icon: <Home />, path: '/' },
    { name: t('clients'), icon: <User />, path: '/clients' },
    { name: t('calendar'), icon: <Calendar />, path: '/calendar' },
    { name: t('finances'), icon: <BarChart3 />, path: '/finances' },
  ];
  
  const communicationItems = [
    { name: t('messages'), icon: <MessageSquare />, action: () => setShowCommunications(true), type: 'sms' },
    { name: t('email'), icon: <Mail />, action: () => setShowCommunications(true), type: 'email' },
    { name: t('call'), icon: <Phone />, action: () => setShowCommunications(true), type: 'call' },
  ];

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-between mb-8">
        {!isCollapsed ? (
          <div className="flex flex-col items-center">
            <img 
              src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png" 
              alt="NeuroBalance Logo" 
              className="h-32 w-auto mb-2 app-logo" // Added app-logo class for dark mode fix
            />
            <h1 className="text-xl font-bold gradient-heading">
              NeuroBalance
            </h1>
          </div>
        ) : (
          <img 
            src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png" 
            alt="NeuroBalance Logo" 
            className="h-24 w-auto mx-auto app-logo" // Added app-logo class for dark mode fix
          />
        )}
        {!isMobile && (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-[#E6ECEA] dark:hover:bg-[#2A5854]/40 transition-colors"
          >
            {isCollapsed ? <Menu /> : <X />}
          </button>
        )}
      </div>

      <div className="flex items-center justify-center space-x-2 mb-4">
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full" 
          onClick={() => setShowSearch(true)}
        >
          <Search className="h-4 w-4" />
        </Button>
        
        <ThemeToggle />
        
        <LanguageSwitch />
      </div>

      <Button 
        variant="outline" 
        size="sm"
        className="mb-4 w-full text-xs"
        onClick={() => setShowCalendarSync(true)}
      >
        <Calendar className="h-3 w-3 mr-1" />
        Google Calendar
      </Button>

      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={cn(
                  'sidebar-item',
                  location.pathname === item.path
                    ? 'sidebar-item-active'
                    : 'sidebar-item-inactive',
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
            'text-[#3A726D] dark:text-[#E6ECEA] font-medium mb-2',
            isCollapsed && !isMobile ? 'text-center text-xs' : 'px-3'
          )}>
            {(!isCollapsed || isMobile) ? t('communications') : 'Com.'}
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
                    'sidebar-item sidebar-item-inactive w-full',
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
          <div className="text-xs text-center text-gray-600 dark:text-gray-400">
            <p>NeuroBalance Clinic</p>
            <p className="mt-1">{t('system')}</p>
          </div>
        )}
      </div>

      {/* Communications Panel Drawer */}
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
      
      {/* Search Dialog */}
      <SearchDialog open={showSearch} onOpenChange={setShowSearch} />
      
      {/* Google Calendar Sync Dialog */}
      <GoogleCalendarSync open={showCalendarSync} onOpenChange={setShowCalendarSync} />
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed top-0 left-0 z-10 w-full bg-white/90 dark:bg-[#1A1F2C]/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 flex justify-between items-center px-4 py-3">
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
          className="h-12 w-auto app-logo" // Added app-logo class for dark mode fix
        />
        
        <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)}>
          <Search />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      'fixed top-0 left-0 h-screen bg-white dark:bg-[#1A1F2C] border-r border-gray-200 dark:border-gray-800 z-10 transition-all duration-300 shadow-md',
      isCollapsed ? 'w-20' : 'w-64',
    )}>
      {renderSidebarContent()}
    </div>
  );
};

export default Sidebar;
