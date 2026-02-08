import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase config - these are publishable keys
const firebaseConfig = {
  apiKey: "AIzaSyATQiZKadnZ5-sdZun4HMf6PQv9cPGp64k",
  authDomain: "billobattlehub.firebaseapp.com",
  projectId: "billobattlehub",
  storageBucket: "billobattlehub.firebasestorage.app",
  messagingSenderId: "1077370113383",
  appId: "G-HZ0T6F5X7P",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
