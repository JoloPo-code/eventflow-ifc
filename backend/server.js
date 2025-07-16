// --- Importation des modules nécessaires ---
const express = require('express');
const cors = require('cors'); 
const { Pool } = require('pg');
const multer = require('multer'); // [NOUVEAU] Pour gérer les téléversements
const { Storage } = require('@google-cloud/storage'); // [NOUVEAU] Pour interagir avec Google Cloud Storage

// --- Initialisation ---
const app = express();
const port = process.env.PORT || 8080;

// [NOUVEAU] Configuration de Google Cloud Storage
const storage = new Storage();
// [IMPORTANT] Remplacez par le nom de votre bucket
const bucketName = 'ifcambodge-eventflow-files'; 
const bucket = storage.bucket(bucketName);

// [NOUVEAU] Configuration de Multer pour stocker les fichiers en mémoire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5 MB par fichier
  },
});

// --- Configuration de la connexion à la base de données ---
const dbConfig = {
  user: 'postgres',
  password: 'VOTRE_MOT_DE_PASSE_BASE_DE_DONNEES',
  database: 'postgres',
  host: '127.0.0.1', 
  port: 5433, 
};

const pool = new Pool(dbConfig);

// --- Middlewares ---
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// ===================================================================
// ROUTES API (PROJETS, RESSOURCES)
// ===================================================================
// ... (vos routes existantes restent ici)
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

// ... (vos routes pour les ressources humaines et l'agenda restent ici) ...

// ===================================================================
// [NOUVEAU] ROUTE API POUR LE TÉLÉVERSEMENT D'IMAGE
// ===================================================================
app.post('/api/projects/:id/image', upload.single('projectImage'), async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).send('Aucun fichier téléversé.');
  }

  // Crée un nom de fichier unique
  const blob = bucket.file(Date.now() + '_' + req.file.originalname);
  
  const blobStream = blob.createWriteStream({
    resumable: false,
  });

  blobStream.on('error', err => {
    console.error(err);
    res.status(500).send({ message: err.message });
  });

  blobStream.on('finish', async () => {
    // Rend le fichier public pour qu'il soit visible
    await blob.makePublic();
    const publicUrl = `https://storage.googleapis.com/\${bucket.name}/\${blob.name}`;

    try {
      // Met à jour la base de données avec l'URL de l'image
      const updateQuery = 'UPDATE projects SET image_url = $1 WHERE id = $2 RETURNING *';
      const result = await pool.query(updateQuery, [publicUrl, id]);
      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).send({ message: "Impossible de sauvegarder l'URL de l'image." });
    }
  });

  blobStream.end(req.file.buffer);
});


// --- Démarrage du serveur ---
app.listen(port, () => {
  console.log(`Serveur EventFlow démarré sur le port \${port}`);
});
