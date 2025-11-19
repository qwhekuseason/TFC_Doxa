import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC9mqgPggWa2UTALfVO0gG1YHG2Hg0Ox38",
  authDomain: "the-faithful-city.firebaseapp.com",
  projectId: "the-faithful-city",
  storageBucket: "the-faithful-city.firebasestorage.app",
  messagingSenderId: "1073685008862",
  appId: "1:1073685008862:web:70c556ee8c76ba98240d4f",
  measurementId: "G-RV2X0SRP8K"
};

// Initialize Firebase with error handling
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;