// --- Importation des modules nécessaires ---
const express = require('express');
const cors = require('cors'); 
const { Pool } = require('pg');

// --- Initialisation de l'application Express ---
const app = express();
const port = process.env.PORT || 8080;

// --- Configuration de la connexion à la base de données ---
// Cette configuration est maintenant dynamique : elle s'adapte à l'environnement.
const dbConfig = {
  user: 'postgres',
  // [MODIFIÉ] Le mot de passe est lu depuis une variable d'environnement sécurisée.
  password: process.env.DB_PASSWORD, 
  database: 'postgres',
  // [MODIFIÉ] Détecte si on est sur Cloud Run (production) ou en local.
  host: process.env.K_SERVICE 
    ? '/cloudsql/eventflow-ifc:asia-southeast1:eventflow-ifc-db' // Chemin du socket pour Cloud Run
    : '127.0.0.1', // Connexion au proxy en local
  port: process.env.K_SERVICE ? 5432 : 5433, // Port standard en production, port du proxy en local
};

const pool = new Pool(dbConfig);

// --- Middlewares ---
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// ===================================================================
// ROUTES API (Aucun changement ici)
// ===================================================================
// ... (Toutes vos routes GET, POST, PUT, DELETE pour les projets et les ressources restent ici) ...
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY start_date DESC, created_at DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des projets', error: error.message });
  }
});
app.post('/api/projects', async (req, res) => {
  const { title, description_fr, description_en, description_km, start_date, duration_minutes } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Le titre est requis.' });
  }
  try {
    const query = `
      INSERT INTO projects (title, description_fr, description_en, description_km, start_date, duration_minutes, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'brouillon')
      RETURNING *;
    `;
    const values = [title, description_fr, description_en, description_km, start_date, duration_minutes];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error);
    res.status(500).json({ message: 'Erreur lors de la création du projet', error: error.message });
  }
});
app.post('/api/projects/:id/duplicate', async (req, res) => {
    const { id } = req.params;
    try {
        const originalProjectResult = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
        if (originalProjectResult.rowCount === 0) {
            return res.status(404).json({ message: 'Projet original non trouvé.' });
        }
        const originalProject = originalProjectResult.rows[0];
        const newTitle = `Copie de - ${originalProject.title}`;
        const duplicateQuery = `
            INSERT INTO projects (title, description_fr, description_en, description_km, start_date, duration_minutes, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'brouillon')
            RETURNING *;
        `;
        const duplicateValues = [
            newTitle,
            originalProject.description_fr,
            originalProject.description_en,
            originalProject.description_km,
            originalProject.start_date,
            originalProject.duration_minutes
        ];
        const newProjectResult = await pool.query(duplicateQuery, duplicateValues);
        res.status(201).json(newProjectResult.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la duplication du projet:', error);
        res.status(500).json({ message: 'Erreur lors de la duplication du projet', error: error.message });
    }
});
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description_fr, description_en, description_km, start_date, duration_minutes, status } = req.body;
    const query = `
      UPDATE projects 
      SET title = $1, description_fr = $2, description_en = $3, description_km = $4, start_date = $5, duration_minutes = $6, status = $7
      WHERE id = $8 RETURNING *;
    `;
    const values = [title, description_fr, description_en, description_km, start_date, duration_minutes, status, id];
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Projet non trouvé.' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du projet:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du projet', error: error.message });
  }
});
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM project_resources WHERE project_id = $1', [id]);
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Projet non trouvé.' });
    }
    res.status(200).json({ message: 'Projet supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la suppression du projet:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du projet', error: error.message });
  }
});
app.get('/api/calendar-events', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, title, start_date, duration_minutes, status_color FROM projects WHERE start_date IS NOT NULL');
    const events = result.rows.map(project => {
      const start = new Date(project.start_date);
      const end = new Date(start.getTime() + (project.duration_minutes || 60) * 60000);
      return {
        id: project.id,
        title: project.title,
        start: start,
        end: end,
        allDay: false,
        resource: { status_color: project.status_color }
      };
    });
    res.status(200).json(events);
  } catch (error) {
    console.error("Erreur lors de la récupération des événements pour l'agenda:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des événements pour l'agenda", error: error.message });
  }
});
app.get('/api/projects/:projectId/resources', async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM project_resources WHERE project_id = $1 ORDER BY start_time', [projectId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des ressources:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des ressources', error: error.message });
    }
});
app.post('/api/projects/:projectId/resources', async (req, res) => {
    const { projectId } = req.params;
    const { role_required, start_time, duration_minutes } = req.body;
    if (!role_required || !start_time || !duration_minutes) {
        return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }
    try {
        const query = `
            INSERT INTO project_resources (project_id, role_required, start_time, duration_minutes)
            VALUES ($1, $2, $3, $4) RETURNING *;
        `;
        const values = [projectId, role_required, start_time, duration_minutes];
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la création de la ressource:', error);
        res.status(500).json({ message: 'Erreur lors de la création de la ressource', error: error.message });
    }
});
app.delete('/api/resources/:resourceId', async (req, res) => {
    const { resourceId } = req.params;
    try {
        await pool.query('DELETE FROM project_resources WHERE id = $1', [resourceId]);
        res.status(200).json({ message: 'Ressource supprimée avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la suppression de la ressource:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression de la ressource', error: error.message });
    }
});


// --- Démarrage du serveur ---
app.listen(port, () => {
  console.log(`Serveur EventFlow démarré sur le port ${port}`);
});
