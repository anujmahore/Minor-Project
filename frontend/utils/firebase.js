// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "multi-ai-agent-9d334.firebaseapp.com",
  projectId: "multi-ai-agent-9d334",
  storageBucket: "multi-ai-agent-9d334.firebasestorage.app",
  messagingSenderId: "857070027404",
  appId: "1:857070027404:web:42ab0d759672e18a6f31a9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth=getAuth(app)
export const googleProvider=new GoogleAuthProvider()