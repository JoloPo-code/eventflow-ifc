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
              className={`p-4 rounded-lg shadow flex items-center justify-between transition duration-300 cursor-pointer ${selectedProjectId === project.id ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-white hover:bg-gray-50'}`}
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