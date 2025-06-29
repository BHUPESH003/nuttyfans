import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  PlusCircleIcon,
  UserCircleIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/feed', icon: HomeIcon, label: 'Feed' },
    { path: '/create', icon: PlusCircleIcon, label: 'Create' },
    { path: '/notifications', icon: BellIcon, label: 'Notifications' },
    { path: '/profile', icon: UserCircleIcon, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="text-2xl font-bold text-blue-600">
                OnlyFans Clone
              </Link>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === item.path
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 pb-16">{children}</main>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center space-y-1 ${
                location.pathname === item.path
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}; 