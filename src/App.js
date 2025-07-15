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
      const response = await fetch(`${API_URL}/projects`);
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
      ? `${API_URL}/projects/${editingProjectId}` 
      : `${API_URL}/projects`;
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
        setError(`Erreur: ${errorData.message || 'Opération impossible.'}`);
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
        const response = await fetch(`${API_URL}/projects/${projectId}`, { method: 'DELETE' });
        if (response.ok) {
          if (editingProjectId === projectId) {
            setEditingProjectId(null);
            setIsCreating(false);
          }
          fetchProjects();
        } else {
          const errorData = await response.json();
          setError(`Erreur: ${errorData.message || 'Impossible de supprimer le projet.'}`);
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
      const response = await fetch(`${API_URL}/projects/${projectId}/duplicate`, { method: 'POST' });
      const newProject = await response.json();
      if (response.ok) {
        await fetchProjects();
        setEditingProjectId(newProject.id);
      } else {
        setError(`Erreur: ${newProject.message || 'Impossible de dupliquer le projet.'}`);
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
              <button onClick={() => setView('list')} className={`px-4 py-2 rounded-md ${view === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                Vue Liste
              </button>
              <button onClick={() => setView('agenda')} className={`px-4 py-2 rounded-md ${view === 'agenda' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
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

export default App; // Force update5