import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { User, Family } from '../types';
import { getFamily, getUsersByFamily } from '../lib/firestore';
import { X, User as UserIcon, Crown, Users, Calendar, Mail, CreditCard as Edit3 } from 'lucide-react';

interface ProfileViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileViewer({ isOpen, onClose }: ProfileViewerProps) {
  const { userData, currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  const [family, setFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!userData?.familyId) return;
      
      try {
        setLoading(true);
        const [familyData, membersData] = await Promise.all([
          getFamily(userData.familyId),
          getUsersByFamily(userData.familyId)
        ]);
        
        setFamily(familyData);
        setFamilyMembers(membersData);
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadProfileData();
    }
  }, [isOpen, userData?.familyId]);

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
            Profile
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* User Profile */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <UserIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className={`text-xl font-bold mb-1 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {userData?.displayName}
                </h3>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  {userData?.role === 'admin' && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className={`text-sm capitalize ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {userData?.role}
                  </span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Mail className={`w-4 h-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <span className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {userData?.email}
                  </span>
                </div>
              </div>

              {/* Family Info */}
              {family && (
                <div className={`p-4 rounded-xl ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h4 className={`font-semibold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Family Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Users className={`w-4 h-4 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <span className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {family.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className={`w-4 h-4 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <span className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Joined {family.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className={`text-sm mt-2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {family.description}
                  </p>
                </div>
              )}

              {/* Family Members */}
              <div>
                <h4 className={`font-semibold mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Family Members ({familyMembers.length})
                </h4>
                <div className="space-y-3">
                  {familyMembers.map((member) => (
                    <div
                      key={member.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {member.displayName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {member.displayName}
                          </span>
                          {member.role === 'admin' && (
                            <Crown className="w-3 h-3 text-yellow-500" />
                          )}
                        </div>
                        <span className={`text-xs capitalize ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edit Profile Button */}
              <button className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all">
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}