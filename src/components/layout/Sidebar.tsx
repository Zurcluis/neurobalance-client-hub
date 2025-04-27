
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, User, BarChart3, Home, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: <Home />, path: '/' },
    { name: 'Clients', icon: <User />, path: '/clients' },
    { name: 'Calendar', icon: <Calendar />, path: '/calendar' },
    { name: 'Finances', icon: <BarChart3 />, path: '/finances' },
  ];

  return (
    <div className={cn(
      'fixed top-0 left-0 h-screen glassmorphism z-10 transition-all duration-300',
      isCollapsed ? 'w-20' : 'w-64',
    )}>
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center justify-between mb-8">
          {!isCollapsed && (
            <h1 className="text-2xl font-bold gradient-heading">
              NeuroBalance
            </h1>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-neuro-soft-purple transition-colors"
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
                      ? 'bg-neuro-primary text-white shadow-md'
                      : 'hover:bg-neuro-soft-purple',
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
            <div className="text-xs text-center text-neuro-gray">
              <p>NeuroBalance Clinic</p>
              <p className="mt-1">Client Management System</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
