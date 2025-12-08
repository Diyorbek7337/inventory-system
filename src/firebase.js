// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2Md2veU-82vTY2shwCOLTZwfZECDXicM",
  authDomain: "inventory-system-d989c.firebaseapp.com",
  projectId: "inventory-system-d989c",
  storageBucket: "inventory-system-d989c.firebasestorage.app",
  messagingSenderId: "932349854922",
  appId: "1:932349854922:web:3318ecf02d7b36ddeae033"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);