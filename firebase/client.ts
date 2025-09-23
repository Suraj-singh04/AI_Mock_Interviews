import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { initializeApp, getApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAKAfwxxfO7x8oqtDtt-ZzohLDn8pvynuM",
  authDomain: "prepwise-c6b28.firebaseapp.com",
  projectId: "prepwise-c6b28",
  storageBucket: "prepwise-c6b28.firebasestorage.app",
  messagingSenderId: "692249169829",
  appId: "1:692249169829:web:0e77f214fb60763251a24c",
  measurementId: "G-RGC81XX0TQ",
};

const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth();
export const db = getFirestore(app);
