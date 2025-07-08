import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCopZ2cOQyH_lWEF2vsuav7b_p1Wcp4Hx4",
    authDomain: "eventflow-ifc-e74c5.firebaseapp.com",
    projectId: "eventflow-ifc-e74c5",
    storageBucket: "eventflow-ifc-e74c5.firebasestorage.app",
    messagingSenderId: "522300759636",
    appId: "1:522300759636:web:a28a386c1d22596efe57c1",
    measurementId: "G-BRB21SC6NK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

provider.setCustomParameters({
  'hd': 'ifcambodge.com' 
});

export const signInWithGoogle = () => {
  return signInWithPopup(auth, provider);
};