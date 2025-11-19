import { Notification } from '../types';
import { Bell, X, CheckCircle, Info } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { markNotificationAsRead } from '../lib/firestore';

interface NotificationPanelProps {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
  onNotificationRead: (id: string) => void;
}

export default function NotificationPanel({ 
  notifications, 
  isOpen, 
  onClose, 
  onNotificationRead 
}: NotificationPanelProps) {
  const { isDarkMode } = useTheme();

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      onNotificationRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'media':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-purple-500" />;
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
            Notifications
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
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className={`w-16 h-16 mb-4 ${
                isDarkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <p className={`text-center ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                No notifications yet
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    notification.isRead
                      ? isDarkMode 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-gray-50 border-gray-200'
                      : isDarkMode
                        ? 'bg-blue-900/20 border-blue-700'
                        : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <h3 className={`font-medium mb-1 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </h3>
                      <p className={`text-sm mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {notification.createdAt.toLocaleDateString()}
                        </span>
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}