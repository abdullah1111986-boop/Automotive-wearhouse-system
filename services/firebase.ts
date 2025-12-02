import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCLafsqzjTdAV7lFKcwl_6_CiUzVekadvw",
  authDomain: "automotive-wearhouse.firebaseapp.com",
  projectId: "automotive-wearhouse",
  storageBucket: "automotive-wearhouse.firebasestorage.app",
  messagingSenderId: "795513430004",
  appId: "1:795513430004:web:4d61a3a4e31e5544a563a1",
  measurementId: "G-06FX41HT20"
};

let db = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("Firebase connected successfully to project: automotive-wearhouse");
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { db };