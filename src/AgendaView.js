/*
================================================================================
 Fichier : src/AgendaView.js
================================================================================
*/
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

const API_URL = '/api';

function AgendaView({ onEventClick }) {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');

  const fetchEvents = useCallback(async () => {
    setError('');
    try {
      const response = await fetch(`${API_URL}/calendar-events`);
      if (!response.ok) throw new Error('Could not fetch events');
      const data = await response.json();
      const formattedEvents = data.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
      setEvents(formattedEvents);
    } catch (err) {
      // [CORRIGÉ] Nettoyage de la chaîne de caractères
      setError("Impossible de charger les événements de l'agenda.");
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);


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