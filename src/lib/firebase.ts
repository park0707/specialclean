// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBLUnhzn5upXxPSv77kSm18-Cjtt5-BZRc",
  authDomain: "speicalclean.firebaseapp.com",
  projectId: "speicalclean",
  storageBucket: "speicalclean.firebasestorage.app",
  messagingSenderId: "41378948171",
  appId: "1:41378948171:web:868edfff371bb927f599ce",
  measurementId: "G-KMMR2CJNQH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);