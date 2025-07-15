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
      if (hours > 0) label += `${hours}h`;
      if (minutes > 0) label += ` ${minutes}min`;
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