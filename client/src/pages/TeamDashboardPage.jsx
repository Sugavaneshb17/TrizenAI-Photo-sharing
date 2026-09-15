import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function TeamDashboardPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/events');
        setEvents(response.data.data.events || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div className="page-state">Loading assigned events...</div>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1>Team dashboard</h1>
      </div>
      <div className="card list-card">
        {events.length === 0 ? (
          <p className="empty-state">No events assigned yet.</p>
        ) : (
          <div className="event-grid">
            {events.map((event) => (
              <Link to={`/team/events/${event._id}`} key={event._id} className="event-card">
                <h3>{event.name}</h3>
                <p>{new Date(event.date).toLocaleDateString()}</p>
                <small>{event.teamMembers?.length || 0} team members</small>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
