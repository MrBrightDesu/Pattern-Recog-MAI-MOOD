import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC9q7fpc0bRbkIDkx2ZqekC1yutkot79y4",
  authDomain: "emotional-552b9.firebaseapp.com",
  projectId: "emotional-552b9",
  storageBucket: "emotional-552b9.firebasestorage.app",
  messagingSenderId: "350494470559",
  appId: "1:350494470559:web:286b8b769ac277c2ce4daa",
  measurementId: "G-9J7874E6Q7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Analytics and get a reference to the service
export const analytics = getAnalytics(app);

export default app;
