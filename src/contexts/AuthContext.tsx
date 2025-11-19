import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUserProfile, createUserProfile, updateUserFamily as firestoreUpdateUserFamily, subscribeToUserProfile } from '../lib/firestore';
import { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string, isAdmin?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  updateUserData: (data: Partial<User>) => void;
  updateUserFamily: (familyId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null | undefined>(undefined);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function signup(email: string, password: string, displayName: string, isAdmin: boolean = false) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile in Firestore
    const newUserData: Omit<User, 'id' | 'createdAt'> = {
      email: user.email!,
      displayName,
      familyId: '', // Will be set when user selects family
      role: isAdmin ? 'admin' : 'member'
    };
    
    await createUserProfile(user.uid, newUserData);
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    setUserData(null);
    await signOut(auth);
  }

  function updateUserData(data: Partial<User>) {
    if (userData) {
      setUserData({ ...userData, ...data });
    }
  }

  async function updateUserFamily(familyId: string) {
    if (currentUser) {
      await firestoreUpdateUserFamily(currentUser.uid, familyId);
      // The real-time listener will update the userData automatically
    }
  }

  useEffect(() => {
    let unsubscribeFromUserProfile: (() => void) | null = null;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      // Clean up previous user profile subscription
      if (unsubscribeFromUserProfile) {
        unsubscribeFromUserProfile();
        unsubscribeFromUserProfile = null;
      }
      
      if (user) {
        // Subscribe to real-time user profile updates
        unsubscribeFromUserProfile = subscribeToUserProfile(user.uid, (profile) => {
          setUserData(profile);
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeFromUserProfile) {
        unsubscribeFromUserProfile();
      }
    };
  }, []);

  const value: AuthContextType = {
    currentUser,
    userData,
    login,
    signup,
    logout,
    loading,
    updateUserData,
    updateUserFamily
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}