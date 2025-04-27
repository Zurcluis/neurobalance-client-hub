
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, User, BarChart3, Home, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: <Home />, path: '/' },
    { name: 'Clientes', icon: <User />, path: '/clients' },
    { name: 'Calendário', icon: <Calendar />, path: '/calendar' },
    { name: 'Finanças', icon: <BarChart3 />, path: '/finances' },
  ];

  return (
    <div className={cn(
      'fixed top-0 left-0 h-screen glassmorphism z-10 transition-all duration-300',
      isCollapsed ? 'w-20' : 'w-64',
    )}>
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center justify-between mb-8">
          {!isCollapsed ? (
            <div className="flex flex-col items-center">
              <img 
                src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png" 
                alt="NeuroBalance Logo" 
                className="h-16 w-auto mb-2"
              />
              <h1 className="text-xl font-bold gradient-heading">
                NeuroBalance
              </h1>
            </div>
          ) : (
            <img 
              src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png" 
              alt="NeuroBalance Logo" 
              className="h-12 w-auto mx-auto"
            />
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-[#c5cfce] transition-colors"
          >
            {isCollapsed ? <Menu /> : <X />}
          </button>
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
                    isCollapsed ? 'justify-center' : 'justify-start'
                  )}
                >
                  <span className="text-xl">{item.icon}</span>
                  {!isCollapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="pt-4">
          {!isCollapsed && (
            <div className="text-xs text-center text-gray-600">
              <p>NeuroBalance Clinic</p>
              <p className="mt-1">Sistema de Gestão de Clientes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
