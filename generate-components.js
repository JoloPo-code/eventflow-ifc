/*
================================================================================
 Fichier : generate-components.js
 Description : Ce script génère les fichiers de base pour les composants React.
 Utilisation : Lancez-le depuis la racine de votre projet avec : node generate-components.js
================================================================================
*/

const fs = require('fs');
const path = require('path');

// --- Définition des templates pour chaque fichier ---

// [MODIFIÉ] L'API_URL est maintenant relative pour fonctionner en production
const appTemplate = `
import React, { useState, useEffect } from 'react';
import { auth, signInWithGoogle } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import ProjectList from './ProjectList';
import ProjectForm from './ProjectForm';
import ProjectResources from './ProjectResources';
import AgendaView from './AgendaView';

const API_URL = '/api'; // Changement crucial pour la production

function App() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('list');

  const activeProject = editingProjectId ? projects.find(p => p.id === editingProjectId) : null;
  const showForm = isCreating || editingProjectId !== null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchProjects();
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(\`\${API_URL}/projects\`);
      if (!response.ok) throw new Error("La réponse du serveur n'est pas OK");
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des projets:", error);
      setError('Impossible de charger les projets.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async (formData) => {
    setLoading(true);
    setError('');
    const url = editingProjectId 
      ? \`\${API_URL}/projects/\${editingProjectId}\` 
      : \`\${API_URL}/projects\`;
    const method = editingProjectId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const savedProject = await response.json();
        setIsCreating(false);
        setEditingProjectId(savedProject.id);
        fetchProjects();
      } else {
        const errorData = await response.json();
        setError(\`Erreur: \${errorData.message || 'Opération impossible.'}\`);
      }
    } catch (error) {
      setError('Une erreur de communication est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(\`\${API_URL}/projects/\${projectId}\`, { method: 'DELETE' });
        if (response.ok) {
          if (editingProjectId === projectId) {
            setEditingProjectId(null);
            setIsCreating(false);
          }
          fetchProjects();
        } else {
          const errorData = await response.json();
          setError(\`Erreur: \${errorData.message || 'Impossible de supprimer le projet.'}\`);
        }
      } catch (error) {
        setError('Une erreur de communication est survenue.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDuplicateProject = async (projectId) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(\`\${API_URL}/projects/\${projectId}/duplicate\`, { method: 'POST' });
      const newProject = await response.json();
      if (response.ok) {
        await fetchProjects();
        setEditingProjectId(newProject.id);
      } else {
        setError(\`Erreur: \${newProject.message || 'Impossible de dupliquer le projet.'}\`);
      }
    } catch (error) {
      setError('Une erreur de communication est survenue.');
    } finally {
      setLoading(false);
    }
  }

  const handleCreateClick = () => {
    setEditingProjectId(null);
    setIsCreating(true);
    setView('list');
  };

  const handleEditClick = (projectId) => {
    setIsCreating(false);
    setEditingProjectId(projectId);
    setView('list');
  };

  const handleCancel = () => {
    setEditingProjectId(null);
    setIsCreating(false);
  };

  const handleLogout = () => {
    signOut(auth).catch((error) => console.error("Erreur de déconnexion", error));
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <div className="w-full max-w-7xl mx-auto bg-white shadow-xl">
        <header className="flex justify-between items-center border-b p-6">
          <h1 className="text-4xl font-bold text-gray-800">EventFlow IFC</h1>
          {user ? (
            <div className="flex items-center">
              <p className="text-gray-600 mr-4">Bienvenue, <span className="font-semibold">{user.displayName}</span></p>
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                Se déconnecter
              </button>
            </div>
          ) : (
             <div className="flex-1 flex justify-end">
               <button onClick={signInWithGoogle} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                  Se connecter avec Google
                </button>
             </div>
          )}
        </header>

        {user && (
          <>
            <div className="p-4 bg-gray-50 border-b flex space-x-2">
              <button onClick={() => setView('list')} className={\`px-4 py-2 rounded-md \${view === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}\`}>
                Vue Liste
              </button>
              <button onClick={() => setView('agenda')} className={\`px-4 py-2 rounded-md \${view === 'agenda' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}\`}>
                Vue Agenda
              </button>
            </div>

            {loading && <p className="text-center text-blue-500 p-4">Chargement...</p>}
            {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4">{error}</p>}
            
            {view === 'list' ? (
              <main className="grid grid-cols-1 md:grid-cols-2 min-h-[calc(100vh-169px)]">
                <div className="p-8 border-r">
                  <div className="mb-6">
                    <button onClick={handleCreateClick} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 text-lg">
                      Créer un nouveau projet
                    </button>
                  </div>
                  <ProjectList
                    projects={projects}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteProject}
                    onDuplicate={handleDuplicateProject}
                    loading={loading}
                    selectedProjectId={editingProjectId}
                  />
                </div>

                <div className="p-8 bg-gray-50">
                  {showForm ? (
                    <div>
                      <ProjectForm 
                        projectToEdit={activeProject}
                        onSave={handleSaveProject}
                        onCancel={handleCancel}
                        loading={loading}
                      />
                      {editingProjectId && (
                        <>
                          <hr className="my-8" />
                          <ProjectResources project={activeProject} />
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 text-lg">Sélectionnez un projet à modifier ou créez-en un nouveau.</p>
                    </div>
                  )}
                </div>
              </main>
            ) : (
              <AgendaView onEventClick={handleEditClick} />
            )}
          </>
        )}
        
        {!user && (
           <div className="flex items-center justify-center h-[calc(100vh-105px)]">
             <p className="text-gray-500 text-2xl">Veuillez vous connecter pour gérer les projets.</p>
           </div>
        )}
      </div>
    </div>
  );
}

export default App;
`;

const projectFormTemplate = `
import React, { useState, useEffect } from 'react';

function ProjectForm({ projectToEdit, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    title: '',
    description_fr: '',
    description_en: '',
    description_km: '',
    start_date: '',
    duration_minutes: 60,
    status: 'brouillon'
  });

  useEffect(() => {
    if (projectToEdit) {
      const formattedStartDate = projectToEdit.start_date ? new Date(projectToEdit.start_date).toISOString().slice(0, 16) : '';
      setFormData({
        title: projectToEdit.title,
        description_fr: projectToEdit.description_fr || '',
        description_en: projectToEdit.description_en || '',
        description_km: projectToEdit.description_km || '',
        start_date: formattedStartDate,
        duration_minutes: projectToEdit.duration_minutes || 60,
        status: projectToEdit.status
      });
    } else {
      setFormData({ title: '', description_fr: '', description_en: '', description_km: '', start_date: '', duration_minutes: 60, status: 'brouillon' });
    }
  }, [projectToEdit]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const durationOptions = [];
  for (let i = 15; i <= 480; i += 15) {
      const hours = Math.floor(i / 60);
      const minutes = i % 60;
      let label = '';
      if (hours > 0) label += \`\${hours}h\`;
      if (minutes > 0) label += \` \${minutes}min\`;
      durationOptions.push({ value: i, label: label.trim() });
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-700 mb-4">{projectToEdit ? 'Modifier les détails du projet' : 'Créer un nouveau projet'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titre du projet</label>
          <input type="text" id="title" name="title" value={formData.title} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" required />
        </div>
        
        <div>
          <label htmlFor="description_fr" className="block text-sm font-medium text-gray-700">Description (Français)</label>
          <textarea id="description_fr" name="description_fr" value={formData.description_fr} onChange={handleFormChange} rows="3" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
        </div>
        <div>
          <label htmlFor="description_en" className="block text-sm font-medium text-gray-700">Description (Anglais)</label>
          <textarea id="description_en" name="description_en" value={formData.description_en} onChange={handleFormChange} rows="3" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
        </div>
        <div>
          <label htmlFor="description_km" className="block text-sm font-medium text-gray-700 font-noto-khmer">Description (ភាសាខ្មែរ)</label>
          <textarea id="description_km" name="description_km" value={formData.description_km} onChange={handleFormChange} rows="3" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm font-noto-khmer" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Date et heure de début</label>
            <input type="datetime-local" id="start_date" name="start_date" value={formData.start_date} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700">Durée</label>
            <select id="duration_minutes" name="duration_minutes" value={formData.duration_minutes} onChange={handleFormChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
              {durationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Statut</label>
          <select id="status" name="status" value={formData.status} onChange={handleFormChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
            <option value="brouillon">Brouillon</option>
            <option value="soumis_pour_validation">Soumis pour validation</option>
            <option value="projet_valide">Projet Validé</option>
            <option value="en_production">En production</option>
            <option value="refuse">Refusé</option>
          </select>
        </div>
        <div className="flex items-center space-x-2 pt-2">
          <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300">
            {loading ? 'Sauvegarde...' : (projectToEdit ? 'Mettre à jour' : 'Créer')}
          </button>
          {projectToEdit && (
            <button type="button" onClick={onCancel} disabled={loading} className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Annuler
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default ProjectForm;
`;

const projectListTemplate = `
import React, { useState, useMemo } from 'react';

function ProjectList({ projects, onEdit, onDelete, onDuplicate, loading, selectedProjectId }) {
  const [sortConfig, setSortConfig] = useState({ key: 'start_date', direction: 'descending' });

  const sortedProjects = useMemo(() => {
    let sortableItems = [...projects];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (!a[sortConfig.key] || !b[sortConfig.key]) return 0;
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [projects, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-700">Liste des projets</h2>
        <select onChange={(e) => requestSort(e.target.value)} className="border-gray-300 rounded-md">
            <option value="start_date">Trier par date</option>
            <option value="title">Trier par titre</option>
            <option value="status">Trier par statut</option>
        </select>
      </div>
      
      {sortedProjects.length > 0 ? (
        <ul className="space-y-3">
          {sortedProjects.map((project) => (
            <li 
              key={project.id} 
              className={\`p-4 rounded-lg shadow flex items-center justify-between transition duration-300 cursor-pointer \${selectedProjectId === project.id ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-white hover:bg-gray-50'}\`}
              onClick={() => onEdit(project.id)}
            >
              <div>
                <p className="font-semibold text-gray-800">{project.title}</p>
                <p className="text-sm text-gray-500">Début : {formatDate(project.start_date)}</p>
                <span 
                  className="text-xs font-bold px-2 py-1 rounded-full mt-1 inline-block" 
                  style={{ color: 'white', backgroundColor: project.status_color || '#808080' }}
                >
                  {project.status}
                </span>
              </div>
              <div className="flex flex-col space-y-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onDuplicate(project.id); }} 
                  className="px-3 py-1 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition duration-300" 
                  disabled={loading}
                >
                  Dupliquer
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(project.id); }} 
                  className="px-3 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition duration-300" 
                  disabled={loading}
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">Aucun projet à afficher.</p>
      )}
    </div>
  );
}

export default ProjectList;
`;

const projectResourcesTemplate = `
import React, { useState, useEffect } from 'react';

const API_URL = '/api'; // Changement crucial pour la production

function ProjectResources({ project }) {
  const [resources, setResources] = useState([]);
  const [newResource, setNewResource] = useState({
    role_required: '',
    start_time: '',
    duration_minutes: 60
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      fetchResources();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  const fetchResources = async () => {
    if (!project) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(\`\${API_URL}/projects/\${project.id}/resources\`);
      if (!response.ok) throw new Error('Could not fetch resources');
      const data = await response.json();
      setResources(data);
    } catch (err) {
      setError('Impossible de charger les ressources.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewResource(prevState => ({ ...prevState, [name]: value }));
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(\`\${API_URL}/projects/\${project.id}/resources\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResource)
      });
      if (!response.ok) throw new Error('Could not add resource');
      setNewResource({ role_required: '', start_time: '', duration_minutes: 60 });
      fetchResources();
    } catch (err) {
      setError("Impossible d'ajouter la ressource.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm("Supprimer cette ressource ?")) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(\`\${API_URL}/resources/\${resourceId}\`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Could not delete resource');
      fetchResources();
    } catch (err) {
      setError('Impossible de supprimer la ressource.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const durationOptions = [];
  for (let i = 15; i <= 480; i += 15) {
      const hours = Math.floor(i / 60);
      const minutes = i % 60;
      let label = '';
      if (hours > 0) label += \`\${hours}h\`;
      if (minutes > 0) label += \` \${minutes}min\`;
      durationOptions.push({ value: i, label: label.trim() });
  }
  
  const getEndTime = (startTime, duration) => {
    if (!startTime || !duration) return '';
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);
    return end.toLocaleString('fr-FR');
  }

  if (!project) return null;

  return (
    <div className="animate-fade-in">
      <h3 className="text-xl font-bold text-gray-700 mb-4">Ressources Humaines Requises</h3>
      {error && <p className="text-red-500">{error}</p>}
      
      <form onSubmit={handleAddResource} className="bg-white p-4 rounded-lg shadow mb-6 space-y-3">
        <input 
          type="text"
          name="role_required"
          value={newResource.role_required}
          onChange={handleFormChange}
          placeholder="Poste requis (ex: Régisseur son)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
        <div className="grid grid-cols-2 gap-2">
            <div>
                <label className="text-sm">Début</label>
                <input type="datetime-local" name="start_time" value={newResource.start_time} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
                <label className="text-sm">Durée</label>
                <select name="duration_minutes" value={newResource.duration_minutes} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    {durationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
        </div>
        <button type="submit" disabled={loading} className="w-full py-2 px-4 text-white bg-blue-500 hover:bg-blue-600 rounded-md disabled:bg-blue-300">
          {loading ? 'Ajout...' : 'Ajouter Ressource'}
        </button>
      </form>

      <ul className="space-y-2">
        {resources.map(res => (
          <li key={res.id} className="bg-white p-3 rounded-md shadow-sm flex justify-between items-center">
            <div>
              <p className="font-semibold">{res.role_required}</p>
              <p className="text-sm text-gray-500">
                Début: {new Date(res.start_time).toLocaleString('fr-FR')} (Fin estimée: {getEndTime(res.start_time, res.duration_minutes)})
              </p>
            </div>
            <button onClick={() => handleDeleteResource(res.id)} className="text-red-500 hover:text-red-700">
              &times;
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProjectResources;
`;

const agendaViewTemplate = `
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import fr from 'date-fns/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'fr': fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const API_URL = '/api'; // Changement crucial pour la production

function AgendaView({ onEventClick }) {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setError('');
    try {
      const response = await fetch(\`\${API_URL}/calendar-events\`);
      if (!response.ok) throw new Error('Could not fetch events');
      const data = await response.json();
      const formattedEvents = data.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
      setEvents(formattedEvents);
    } catch (err) {
      setError('Impossible de charger les événements de l\\'agenda.');
      console.error(err);
    }
  };

  const eventPropGetter = useCallback(
    (event) => ({
      style: {
        backgroundColor: event.resource.status_color || '#808080',
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    }),
    []
  );

  return (
    <div className="p-8 h-[calc(100vh-169px)]">
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        messages={{
          next: "Suivant",
          previous: "Précédent",
          today: "Aujourd'hui",
          month: "Mois",
          week: "Semaine",
          day: "Jour",
          agenda: "Agenda",
          date: "Date",
          time: "Heure",
          event: "Événement",
        }}
        eventPropGetter={eventPropGetter}
        onSelectEvent={event => onEventClick(event.id)}
      />
    </div>
  );
}

export default AgendaView;
`;

// --- Logique pour écrire les fichiers ---

const filesToCreate = [
  { name: 'App.js', content: appTemplate },
  { name: 'ProjectForm.js', content: projectFormTemplate },
  { name: 'ProjectList.js', content: projectListTemplate },
  { name: 'ProjectResources.js', content: projectResourcesTemplate },
  { name: 'AgendaView.js', content: agendaViewTemplate },
];

const srcDir = path.join(process.cwd(), 'src');

if (!fs.existsSync(srcDir)) {
  console.error("Erreur : Le dossier 'src' n'a pas été trouvé. Assurez-vous de lancer ce script depuis la racine de votre projet React.");
  process.exit(1);
}

filesToCreate.forEach(file => {
  const filePath = path.join(srcDir, file.name);
  try {
    fs.writeFileSync(filePath, file.content.trim());
    console.log(`Fichier \${filePath} créé/mis à jour avec succès.`);
  } catch (error) {
    console.error(`Erreur lors de l'écriture du fichier \${filePath}:`, error);
  }
});

console.log("\\nOpération terminée !");
