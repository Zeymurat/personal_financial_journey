// Firebase App (the core Firebase SDK) is always required
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB1igpkrV8gpJ6HNt63NJV5fdKq4q9VXCU",
  authDomain: "the-financial-journey.firebaseapp.com",
  projectId: "the-financial-journey",
  storageBucket: "the-financial-journey.firebasestorage.app",
  messagingSenderId: "866172589908",
  appId: "1:866172589908:web:56057af7416eba5959dac1",
  measurementId: "G-ZKBDY1P2PF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
