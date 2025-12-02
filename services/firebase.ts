import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAtD67pZfgRLEOyTyDDRvxERDl4I67TTWM",
  authDomain: "sijil-trainee.firebaseapp.com",
  projectId: "sijil-trainee",
  storageBucket: "sijil-trainee.firebasestorage.app",
  messagingSenderId: "725607426652",
  appId: "1:725607426652:web:9dcb6f3e57abbd39cd5499",
  measurementId: "G-1NF01RV093"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);