import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Remplacer par vos propres clés depuis les paramètres du projet Firebase
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// [IMPORTANT] Forcer la connexion pour votre domaine Workspace
provider.setCustomParameters({
  'hd': 'ifcambodge.com' 
});

export { auth };

export const signInWithGoogle = () => {
  return signInWithPopup(auth, provider);
};