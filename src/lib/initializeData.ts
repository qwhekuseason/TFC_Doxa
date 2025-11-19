import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { InitialSetupConfig } from '../types';

export const initializeApp = async (config: InitialSetupConfig) => {
  try {
    // First check if config exists
    const configRef = doc(db, 'config', 'church');
    const configDoc = await getDoc(configRef);

    if (configDoc.exists()) {
      throw new Error('App is already initialized');
    }

    // Create super admin account first
    const userCred = await createUserWithEmailAndPassword(
      auth,
      config.superAdmin.email,
      config.superAdmin.password
    );

    // Create initial church config
    await setDoc(configRef, {
      name: config.churchName,
      createdAt: serverTimestamp(),
      superAdminId: userCred.user.uid,
      initialized: true
    });

    // Create super admin profile
    await setDoc(doc(db, 'users', userCred.user.uid), {
      id: userCred.user.uid,
      email: config.superAdmin.email,
      displayName: config.superAdmin.displayName,
      phoneNumber: config.superAdmin.phoneNumber,
      role: 'super_admin',
      createdAt: serverTimestamp()
    });

    // Sign out to force re-auth
    await signOut(auth);
    return true;

  } catch (error: any) {
    console.error('Initialization failed:', error);
    // Handle specific error cases
    if (error.code === 'permission-denied') {
      throw new Error('Please check Firestore rules to allow initialization');
    }
    throw error;
  }
};

export const initializeFamilies = async () => {
  const families = [
    {
      id: 'doxa-portal',
      name: 'Doxa Portal Family',
      description: 'A community dedicated to worship and spiritual growth through divine revelation and praise.',
      imageUrl: 'https://images.pexels.com/photos/8468470/pexels-photo-8468470.jpeg?auto=compress&cs=tinysrgb&w=800',
      memberCount: 0,
      createdAt: serverTimestamp()
    },
    {
      id: 'rhema',
      name: 'Rhema Family',
      description: 'United by the spoken word of God, building faith through scripture and fellowship.',
      imageUrl: 'https://images.pexels.com/photos/1587927/pexels-photo-1587927.jpeg?auto=compress&cs=tinysrgb&w=800',
      memberCount: 0,
      createdAt: serverTimestamp()
    },
    {
      id: 'glory',
      name: 'Glory Family',
      description: 'Reflecting God\'s glory in our daily lives and sharing His light with the world.',
      imageUrl: 'https://images.pexels.com/photos/1587927/pexels-photo-1587927.jpeg?auto=compress&cs=tinysrgb&w=800',
      memberCount: 0,
      createdAt: serverTimestamp()
    },
    {
      id: 'grace',
      name: 'Grace Family',
      description: 'Living by grace through faith, extending God\'s love and mercy to all.',
      imageUrl: 'https://images.pexels.com/photos/8468470/pexels-photo-8468470.jpeg?auto=compress&cs=tinysrgb&w=800',
      memberCount: 0,
      createdAt: serverTimestamp()
    },
    {
      id: 'hope',
      name: 'Hope Family',
      description: 'Anchored in hope, spreading encouragement and faith in our community.',
      imageUrl: 'https://images.pexels.com/photos/1587927/pexels-photo-1587927.jpeg?auto=compress&cs=tinysrgb&w=800',
      memberCount: 0,
      createdAt: serverTimestamp()
    }
  ];

  try {
    for (const family of families) {
      const familyRef = doc(db, 'families', family.id);
      await setDoc(familyRef, family, { merge: true });
    }
    console.log('Families initialized successfully');
  } catch (error) {
    console.error('Error initializing families:', error);
  }
};