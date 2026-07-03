// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPfldAIYbUsus46_V3OAQRXkRLUxzr7oE",
  authDomain: "ripasso-8a3bc.firebaseapp.com",
  projectId: "ripasso-8a3bc",
  storageBucket: "ripasso-8a3bc.firebasestorage.app",
  messagingSenderId: "339789592498",
  appId: "1:339789592498:web:007d787244fd4f6376d6ab"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);