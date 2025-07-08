// Dans src/App.js
import React, { useState, useEffect } from 'react';
import { auth } from './firebase'; // Importez l'instance auth
import { signInWithGoogle } from './firebase'; // Importez votre fonction de connexion
import { onAuthStateChanged, signOut } from 'firebase/auth';
import './App.css';

function App() {
  const [user, setUser] = useState(null); // Pour stocker les infos de l'utilisateur connecté

  // Ce hook s'exécute au chargement pour vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe(); // Nettoyage à la fin
  }, []);

  const handleLogout = () => {
    signOut(auth).catch((error) => console.error("Erreur de déconnexion", error));
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>EventFlow IFC</h1>
        {user ? (
          <div>
            <p>Bienvenue , {user.displayName} ({user.email})</p>
            <button onClick={handleLogout}>Se déconnecter</button>
          </div>
        ) : (
          <button onClick={signInWithGoogle}>Se connecter avec Google</button>
        )}
      </header>
    </div>
  );
}

export default App;