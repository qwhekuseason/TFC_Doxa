import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, Bell, User, Settings, Heart } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  notificationCount?: number;
}

export default function Layout({ 
  children, 
  title, 
  onNotificationClick,
  onProfileClick,
  onSettingsClick,
  notificationCount = 0
}: LayoutProps) {
  const { userData, logout } = useAuth();
  const { isDarkMode } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className={`min-h-screen transition-colors ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-purple-50 via-white to-blue-50'
    }`}>
      {/* Header */}
      <header className={`backdrop-blur-md border-b sticky top-0 z-40 transition-colors ${
        isDarkMode 
          ? 'bg-gray-800/80 border-gray-700' 
          : 'bg-white/80 border-purple-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  The Faithful City
                </h1>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {title}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={onNotificationClick}
                className={`relative p-2 transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-purple-400' 
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </button>
              
              <button 
                onClick={onProfileClick}
                className="flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {userData?.displayName}
                  </p>
                  <p className={`text-xs capitalize ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {userData?.role}
                  </p>
                </div>
              </button>

              <button
                onClick={onSettingsClick}
                className={`p-2 transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-300' 
                    : 'text-gray-600 hover:text-gray-700'
                }`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              <button
                onClick={handleLogout}
                className={`p-2 transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-red-400' 
                    : 'text-gray-600 hover:text-red-600'
                }`}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}