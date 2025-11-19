import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Auth from './components/Auth';
import FamilySelection from './components/FamilySelection';
import FamilyDashboard from './components/FamilyDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import InitialSetup from './components/InitialSetup';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const { currentUser, userData } = useAuth();
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(true);

  // Show loading state while auth is being determined
  if (currentUser === undefined || (currentUser && userData === undefined)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Auth />;
  }

  // super admin sees the global console
  if (userData?.role === 'super_admin') {
    return (
      <SuperAdminDashboard
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
      />
    );
  }

  if (!userData?.familyId) {
    return <FamilySelection />;
  }

  return <FamilyDashboard />;
}

export default function App() {
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const checkInitialization = async () => {
      try {
        const configDoc = await getDoc(doc(db, 'config', 'church'));
        setIsInitialized(configDoc.exists());
      } catch (error: any) {
        console.error('Failed to check initialization:', error);
        setInitError(error.message);
        setIsInitialized(false);
      }
    };

    checkInitialization();
  }, []);

  if (isInitialized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Initialization Error</h1>
          <p className="text-gray-600">{initError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return <InitialSetup />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/" element={<AppContent />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}