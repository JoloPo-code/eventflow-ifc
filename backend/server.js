// --- Importation des modules nécessaires ---
const express = require('express');
const cors = require('cors'); // [NOUVEAU] Importation du module CORS
const { Pool } = require('pg');

// --- Initialisation de l'application Express ---
const app = express();
const port = process.env.PORT || 8080;

// --- Configuration de la connexion à la base de données ---
const dbConfig = {
  user: 'postgres',
  password: 'Angk0rTh0m1xXx011',
  database: 'postgres',
  host: '127.0.0.1', 
  port: 5433, 
};

const pool = new Pool(dbConfig);

// --- Middlewares ---
// [MODIFIÉ] Autoriser les requêtes depuis votre application React (http://localhost:3000)
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// ===================================================================
// VOS ROUTES API RESTENT ICI (AUCUN CHANGEMENT NÉCESSAIRE)
// ===================================================================
// Route pour récupérer tous les projets
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY start_date DESC, created_at DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des projets', error: error.message });
  }
});
// ... et toutes vos autres routes (POST, PUT, DELETE, etc.)


// --- Démarrage du serveur ---
app.listen(port, () => {
  console.log(`Serveur EventFlow démarré sur le port ${port}`);
});
