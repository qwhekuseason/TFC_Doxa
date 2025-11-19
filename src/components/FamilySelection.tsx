import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Family } from '../types';
import { getFamilies, checkAdminLimit } from '../lib/firestore';
import { initializeFamilies } from '../lib/initializeData';
import { Users, ArrowRight, Plus, Crown, AlertTriangle } from 'lucide-react';

export default function FamilySelection() {
  const { isDarkMode } = useTheme();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [adminLimitWarning, setAdminLimitWarning] = useState<string | null>(null);
  const { updateUserFamily, currentUser, userData } = useAuth();

  useEffect(() => {
    const loadFamilies = async () => {
      try {
        // Initialize families if they don't exist
        await initializeFamilies();
        
        // Fetch families from Firestore
        const familiesData = await getFamilies();
        setFamilies(familiesData);
      } catch (error) {
        console.error('Error loading families:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFamilies();
  }, []);

  const handleFamilySelect = async (familyId: string) => {
    setSelectedFamily(familyId);
    setAdminLimitWarning(null);
    
    // Check if user is admin and family already has 2 admins
    if (userData?.role === 'admin') {
      const canAddAdmin = await checkAdminLimit(familyId);
      if (!canAddAdmin) {
        setAdminLimitWarning('This family already has 2 admins. You will join as a regular member.');
      }
    }
  };
  const handleJoinFamily = async () => {
    if (selectedFamily && currentUser) {
      await updateUserFamily(selectedFamily);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-purple-50 via-white to-blue-50'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-purple-50 via-white to-blue-50'
    }`}>
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-4xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Choose Your Family
          </h1>
          <p className={`text-xl max-w-2xl mx-auto ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Select the family you belong to and connect with your community
          </p>
          {userData?.role === 'admin' && (
            <div className={`mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
              isDarkMode ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
            }`}>
              <Crown className="w-4 h-4" />
              <span className="text-sm font-medium">Admin Account</span>
            </div>
          )}
        </div>

        {adminLimitWarning && (
          <div className={`mb-6 p-4 rounded-xl border ${
            isDarkMode 
              ? 'bg-yellow-900/20 border-yellow-800 text-yellow-200' 
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium">Admin Limit Reached</p>
                <p className="text-sm mt-1">{adminLimitWarning}</p>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {families.map((family) => (
            <div
              key={family.id}
              onClick={() => handleFamilySelect(family.id)}
              className={`relative cursor-pointer rounded-2xl p-6 transition-all duration-300 ${
                selectedFamily === family.id
                  ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white scale-105 shadow-2xl'
                  : isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700 shadow-lg hover:shadow-xl text-white'
                    : 'bg-white hover:bg-gray-50 shadow-lg hover:shadow-xl'
              }`}
            >
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  selectedFamily === family.id
                    ? 'bg-white/20'
                    : 'bg-gradient-to-br from-purple-600 to-blue-600'
                }`}>
                  <Users className={`w-8 h-8 ${
                    selectedFamily === family.id ? 'text-white' : 'text-white'
                  }`} />
                </div>
                <h3 className="text-xl font-bold mb-2">{family.name}</h3>
                <p className={`text-sm mb-4 ${
                  selectedFamily === family.id 
                    ? 'text-white/90' 
                    : isDarkMode 
                      ? 'text-gray-300' 
                      : 'text-gray-600'
                }`}>
                  {family.description}
                </p>
                <div className={`flex items-center justify-center space-x-2 text-sm ${
                  selectedFamily === family.id 
                    ? 'text-white/90' 
                    : isDarkMode 
                      ? 'text-gray-400' 
                      : 'text-gray-500'
                }`}>
                  <Users className="w-4 h-4" />
                  <span>
                    {family.memberCount > 0 
                      ? `${family.memberCount} member${family.memberCount !== 1 ? 's' : ''}`
                      : 'No members yet'
                    }
                  </span>
                </div>
              </div>

              {selectedFamily === family.id && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleJoinFamily}
            disabled={!selectedFamily}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed space-x-2"
          >
            <span>Join Family</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center mt-8">
          <p className={`mb-4 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Don't see your family?
          </p>
          <button className={`inline-flex items-center font-medium space-x-2 ${
            isDarkMode 
              ? 'text-purple-400 hover:text-purple-300' 
              : 'text-purple-600 hover:text-purple-700'
          }`}>
            <Plus className="w-4 h-4" />
            <span>Request New Family</span>
          </button>
        </div>
      </div>
    </div>
  );
}