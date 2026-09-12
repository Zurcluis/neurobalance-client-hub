import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  Clock,
  FileText,
  Home,
  LogOut,
  Mail,
  Map,
  Megaphone,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Activity,
  PieChart,
  Search,
  TrendingUp,
  User,
  UserCog,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile, useSidebarCollapsed } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CommunicationsPanel from '@/components/communications/CommunicationsPanel';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LanguageSwitch } from '@/components/language/LanguageSwitch';
import { useLanguage } from '@/hooks/use-language';
import SearchDialog from '@/components/search/SearchDialog';
import GoogleCalendarSync from '@/components/calendar/GoogleCalendarSync';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminProfileDialog from '@/components/admin/AdminProfileDialog';
import { toast } from 'sonner';
import { NotificationBar } from '@/components/notifications/NotificationBar';
import { DatabaseManagerDialog } from '@/components/dashboard/DatabaseManagerDialog';
import { KeyboardShortcutsDialog } from '@/components/accessibility/KeyboardShortcutsDialog';

interface NavItem {
  name: string;
  icon: LucideIcon;
  path: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

type CommunicationType = 'sms' | 'email' | 'call';

const Sidebar = () => {
  const { isCollapsed, toggle: toggleCollapsed } = useSidebarCollapsed();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showCommunications, setShowCommunications] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCalendarSync, setShowCalendarSync] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const { session, logout: adminLogout } = useAdminAuth();
  const isPartner = session?.role === 'partner';

  const iconOnly = isCollapsed && !isMobile;
  const iconClass = isMobile ? 'h-6 w-6' : 'h-5 w-5';

  useEffect(() => {
    const commType = localStorage.getItem('communicationType');
    if (commType) {
      localStorage.removeItem('communicationType');
    }
  }, []);

  useEffect(() => {
    const handleOpenSearch = () => setShowSearch(true);
    window.addEventListener('open-search', handleOpenSearch);
    return () => window.removeEventListener('open-search', handleOpenSearch);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      adminLogout();
      toast.success(t('logoutSuccess'));
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error(t('logoutError'));
    }
  };

  const menuSections: NavSection[] = useMemo(() => {
    const sections: NavSection[] = [
      {
        label: t('operation'),
        items: [
          { name: t('dashboard'), icon: Home, path: '/' },
          { name: t('clients'), icon: User, path: '/clients' },
          { name: t('calendar'), icon: Calendar, path: '/calendar' },
          { name: t('availability'), icon: Clock, path: '/admin/availability' },
          { name: t('floorPlan'), icon: Map, path: '/floor-plan' },
        ],
      },
    ];

    if (!isPartner) {
      sections.push({
        label: t('management'),
        items: [
          { name: t('finances'), icon: BarChart3, path: '/finances' },
          { name: t('investments'), icon: TrendingUp, path: '/investments' },
          { name: t('statistics'), icon: PieChart, path: '/statistics' },
          { name: t('marketing'), icon: Megaphone, path: '/marketing-reports' },
        ],
      });
      sections.push({
        label: t('system'),
        items: [
          { name: t('clinicProfile'), icon: FileText, path: '/clinic-info' },
          { name: t('monitoring'), icon: Activity, path: '/monitoring' },
          { name: t('administrative'), icon: UserCog, path: '/admin-management' },
        ],
      });
    } else {
      sections.push({
        label: t('system'),
        items: [
          { name: t('clinicProfile'), icon: FileText, path: '/clinic-info' },
        ],
      });
    }

    return sections;
  }, [isPartner, t]);

  const communicationItems: { name: string; icon: LucideIcon; type: CommunicationType }[] = [
    { name: t('messages'), icon: MessageSquare, type: 'sms' },
    { name: t('email'), icon: Mail, type: 'email' },
    { name: t('call'), icon: Phone, type: 'call' },
  ];

  const isActivePath = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const getItemClass = (active: boolean) =>
    cn(
      'sidebar-item rounded-lg',
      active ? 'sidebar-item-active' : 'sidebar-item-inactive',
      isMobile ? 'px-4 py-3 text-base' : 'py-2.5 px-3',
      iconOnly && 'justify-center px-2'
    );

  const renderNavLink = (item: NavItem) => {
    const active = isActivePath(item.path);
    if (iconOnly) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to={item.path}
              className={getItemClass(active)}
              aria-label={item.name}
              aria-current={active ? 'page' : undefined}
            >
              <item.icon className={iconClass} aria-hidden="true" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{item.name}</TooltipContent>
        </Tooltip>
      );
    }
    return (
      <Link
        to={item.path}
        className={getItemClass(active)}
        aria-current={active ? 'page' : undefined}
        onClick={isMobile ? () => setDrawerOpen(false) : undefined}
      >
        <item.icon className={iconClass} aria-hidden="true" />
        <span className={cn('truncate', isMobile && 'font-medium')}>{item.name}</span>
      </Link>
    );
  };

  const renderCommunicationButton = (item: { name: string; icon: LucideIcon; type: CommunicationType }) => {
    const handleClick = () => {
      localStorage.setItem('communicationType', item.type);
      setShowCommunications(true);
    };
    if (iconOnly) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleClick}
              className={getItemClass(false)}
              aria-label={item.name}
            >
              <item.icon className={iconClass} aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{item.name}</TooltipContent>
        </Tooltip>
      );
    }
    return (
      <button type="button" onClick={handleClick} className={getItemClass(false)} aria-label={item.name}>
        <item.icon className={iconClass} aria-hidden="true" />
        <span className={cn('truncate', isMobile && 'font-medium')}>{item.name}</span>
      </button>
    );
  };

  const sectionLabelClass = cn(
    'mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
    isMobile ? 'px-4' : 'px-3'
  );

  const renderSidebarContent = () => (
    <div
      className={cn(
        'flex h-full flex-col',
        iconOnly ? 'p-3' : 'p-4',
        isMobile && 'pt-safe mobile-menu-content'
      )}
    >
      {isMobile && (
        <div className="mb-6 flex items-center justify-between">
          <img
            src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png"
            alt="NeuroBalance Logo"
            className="h-10 w-auto app-logo"
          />
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" aria-label="Fechar">
              <X className="h-5 w-5" />
            </Button>
          </DrawerClose>
        </div>
      )}

      {!isMobile && (
        <div className={cn('flex flex-col items-center', iconOnly ? 'mb-4' : 'mb-6')}>
          <img
            src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png"
            alt="NeuroBalance Logo"
            className={cn(
              'app-logo object-contain transition-all duration-300',
              iconOnly ? 'h-9 w-9' : 'h-14 w-14'
            )}
          />
          {!iconOnly && (
            <div className="mt-2 text-center">
              <h1 className="text-base font-semibold text-primary dark:text-[hsl(var(--neuro-light-teal))]">
                NeuroBalance
              </h1>
              <p className="text-xs text-muted-foreground">{t('clientManagement')}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn('text-muted-foreground hover:bg-muted hover:text-foreground', iconOnly ? 'mt-2' : 'mt-3')}
            onClick={toggleCollapsed}
            aria-label={isCollapsed ? t('expandSidebar') : t('collapseSidebar')}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      )}

      <div className={cn('relative', iconOnly ? 'mb-6' : 'mb-8')}>
        {iconOnly ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-center px-2"
                onClick={() => setShowSearch(true)}
                aria-label={`${t('openQuickSearch')} (Ctrl+K)`}
              >
                <Search className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{t('searchShortcut')}</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="outline"
            className="w-full justify-between px-3 py-2 h-auto text-left"
            onClick={() => setShowSearch(true)}
            aria-label={`${t('openQuickSearch')} (Ctrl+K)`}
          >
            <span className="text-muted-foreground">{t('searchPlaceholder')}</span>
            <Search className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </Button>
        )}
      </div>

      <nav
        id="navigation"
        className="flex-1"
        aria-label={t('mainMenu')}
      >
        <div className={cn('space-y-6', isMobile && 'space-y-8')}>
          {menuSections.map((section) => (
            <div key={section.label}>
              {!iconOnly && <p className={sectionLabelClass}>{section.label}</p>}
              <ul className={cn('space-y-1', isMobile && 'space-y-2')}>
                {section.items.map((item) => (
                  <li key={item.path}>{renderNavLink(item)}</li>
                ))}
              </ul>
            </div>
          ))}

          <div role="region" aria-label={t('communications')}>
            {!iconOnly && <p className={sectionLabelClass}>{t('communications')}</p>}
            <ul className={cn('space-y-1', isMobile && 'space-y-2')}>
              {communicationItems.map((item) => (
                <li key={item.type}>{renderCommunicationButton(item)}</li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      <div className="mt-auto border-t border-border pt-3">
        <div
          className={cn(
            'flex items-center',
            iconOnly ? 'flex-wrap justify-center gap-1' : 'justify-between px-1'
          )}
        >
          <div className={cn('flex items-center', iconOnly ? 'flex-wrap justify-center gap-1' : 'gap-1')}>
            <ThemeToggle />
            <LanguageSwitch />
            {renderFooterAction({
              label: t('syncGoogleCalendar'),
              onClick: () => setShowCalendarSync(true),
              icon: Calendar,
            })}
            {renderFooterAction({
              label: t('editProfile'),
              onClick: () => setShowProfileDialog(true),
              icon: User,
            })}
            <KeyboardShortcutsDialog />
            <DatabaseManagerDialog />
          </div>
          <NotificationBar />
        </div>

        {renderLogout()}

        {!iconOnly && (
          <div className="mt-4 text-center text-xs text-muted-foreground">
            <p>NeuroBalance Clinic</p>
            <p className="mt-1">{t('system')} v1.0.0</p>
          </div>
        )}
      </div>

      <Drawer open={showCommunications} onOpenChange={setShowCommunications}>
        <DrawerContent className="max-h-[90vh] overflow-y-auto">
          <div className="p-4 pt-safe">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">{t('communications')}</h2>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Fechar">
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

  const footerActionClass =
    'rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';

  function renderFooterAction({ label, onClick, icon: Icon }: { label: string; onClick: () => void; icon: LucideIcon }) {
    if (iconOnly) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className={footerActionClass} onClick={onClick} aria-label={label}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      );
    }
    return (
      <button type="button" className={footerActionClass} onClick={onClick} aria-label={label} title={label}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </button>
    );
  }

  function renderLogout() {
    if (iconOnly) {
      return (
        <div className="mt-2 flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
                onClick={handleLogout}
                aria-label={t('logoutSystem')}
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{t('logout')}</TooltipContent>
          </Tooltip>
        </div>
      );
    }
    return (
      <Button
        variant="ghost"
        className="mt-4 flex w-full items-center justify-center text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={handleLogout}
        aria-label={t('logoutSystem')}
      >
        <LogOut className="mr-2 h-5 w-5" aria-hidden="true" />
        {t('logout')}
      </Button>
    );
  }

  const renderDialogs = () => (
    <>
      <SearchDialog open={showSearch} onOpenChange={setShowSearch} />
      <GoogleCalendarSync open={showCalendarSync} onOpenChange={setShowCalendarSync} />
      <AdminProfileDialog open={showProfileDialog} onOpenChange={setShowProfileDialog} />
    </>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 z-40 w-full bg-background/95 backdrop-blur-sm border-b border-border flex justify-between items-center px-4 py-3 pt-safe">
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 flex items-center justify-center rounded-full"
                aria-label={t('openNavigationMenu')}
              >
                <Menu className="h-6 w-6" aria-hidden="true" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[95vh] rounded-t-xl border-t-0">
              {renderSidebarContent()}
            </DrawerContent>
          </Drawer>

          <img
            src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png"
            alt="NeuroBalance Logo"
            className="h-10 w-auto app-logo object-contain"
          />

          <div className="flex items-center gap-2">
            <NotificationBar />
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 flex items-center justify-center rounded-full"
              onClick={() => setShowSearch(true)}
              aria-label={t('openQuickSearch')}
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {renderDialogs()}
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          'fixed top-0 left-0 h-screen bg-background border-r border-border z-40 transition-all duration-300 overflow-y-auto',
          isCollapsed ? 'w-20 scrollbar-hide' : 'w-64',
        )}
      >
        {renderSidebarContent()}
      </div>
      {renderDialogs()}
    </>
  );
};

export default Sidebar;
