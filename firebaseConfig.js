// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAaFi5rQZ1T6SwWXGTEO_UJgn7U5nH0nLA",
  authDomain: "torneosquash-b4810.firebaseapp.com",
  databaseURL: "https://torneosquash-b4810-default-rtdb.firebaseio.com/",
  projectId: "torneosquash-b4810",
  storageBucket: "torneosquash-b4810.firebasestorage.app",
  messagingSenderId: "102656652121",
  appId: "1:102656652121:web:8e5a8dd51abb6cf593d248",
  measurementId: "G-9C3SZRQX4C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const analytics = getAnalytics(app);

export {database};