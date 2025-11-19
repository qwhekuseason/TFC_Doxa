import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { X, Moon, Sun, Bell, Shield, User, LogOut, Volume2 } from 'lucide-react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`absolute right-0 top-0 h-full w-96 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      } shadow-2xl transform transition-transform`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className={`text-xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Settings
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto h-full pb-20">
          <div className="p-6 space-y-6">
            {/* Appearance */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Appearance
              </h3>
              <div className="space-y-3">
                <div className={`flex items-center justify-between p-4 rounded-xl ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-3">
                    {isDarkMode ? (
                      <Moon className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Sun className="w-5 h-5 text-yellow-500" />
                    )}
                    <div>
                      <span className={`font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Dark Mode
                      </span>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Toggle dark theme
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isDarkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Notifications
              </h3>
              <div className="space-y-3">
                <div className={`flex items-center justify-between p-4 rounded-xl ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-purple-500" />
                    <div>
                      <span className={`font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Push Notifications
                      </span>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Receive notifications
                      </p>
                    </div>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                  </button>
                </div>
                
                <div className={`flex items-center justify-between p-4 rounded-xl ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-3">
                    <Volume2 className="w-5 h-5 text-green-500" />
                    <div>
                      <span className={`font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Sound Effects
                      </span>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Play notification sounds
                      </p>
                    </div>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Privacy & Security */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Privacy & Security
              </h3>
              <div className="space-y-3">
                <button className={`w-full flex items-center space-x-3 p-4 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <Shield className="w-5 h-5 text-blue-500" />
                  <div>
                    <span className={`font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Privacy Settings
                    </span>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Manage your privacy preferences
                    </p>
                  </div>
                </button>
                
                <button className={`w-full flex items-center space-x-3 p-4 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <User className="w-5 h-5 text-purple-500" />
                  <div>
                    <span className={`font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Account Settings
                    </span>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Update your account information
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Logout */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}