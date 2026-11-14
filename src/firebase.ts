import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  signInAnonymously,
  User as FirebaseUser
} from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyC61ox4Fu2lbaQsAHYTVE_EW2Hb8j9LajI",
  authDomain: "aminoacgo-web.firebaseapp.com",
  projectId: "aminoacgo-web",
  storageBucket: "aminoacgo-web.firebasestorage.app",
  messagingSenderId: "586132430511",
  appId: "1:586132430511:web:0f35c258bb8df3e35bbe5a",
  measurementId: "G-VNMHC6GV46"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Safe Analytics initialization
export let analytics: ReturnType<typeof getAnalytics> | null = null;
// 本地跳过登录测试时，不向 Firebase Analytics 上报数据
const skipAuthInDev = import.meta.env.DEV && import.meta.env.VITE_SKIP_AUTH === 'true';
if (typeof window !== "undefined" && !skipAuthInDev) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  signInAnonymously
};
export type { FirebaseUser };


