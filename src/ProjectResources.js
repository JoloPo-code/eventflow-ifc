import React, { useState, useEffect } from 'react';

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
      const response = await fetch(`http://localhost:8080/api/projects/${project.id}/resources`);
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
      const response = await fetch(`http://localhost:8080/api/projects/${project.id}/resources`, {
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
      const response = await fetch(`http://localhost:8080/api/resources/${resourceId}`, { method: 'DELETE' });
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
      if (hours > 0) label += `${hours}h`;
      if (minutes > 0) label += ` ${minutes}min`;
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