import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function AdminDashboardPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  const loadEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data.data.events || []);
    } catch (err) {
      setError(err.message || 'Unable to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await api.post('/events', { name, date, description });
      setName('');
      setDate('');
      setDescription('');
      loadEvents();
    } catch (err) {
      setError(err.message || 'Unable to create event');
    }
  };

  if (loading) return <div className="page-state">Loading events...</div>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1>Admin dashboard</h1>
      </div>

      <form className="card form-card" onSubmit={handleCreate}>
        <h2>Create event</h2>
        <div className="two-columns">
          <label>
            Event name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Event date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
        </div>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" />
        </label>
        <button type="submit">Create event</button>
      </form>

      {error ? <p className="error-message">{error}</p> : null}

      <div className="card list-card">
        <h2>Events</h2>
        {events.length === 0 ? (
          <p className="empty-state">No events created yet.</p>
        ) : (
          <div className="event-grid">
            {events.map((event) => (
              <Link to={`/admin/events/${event._id}`} key={event._id} className="event-card">
                <h3>{event.name}</h3>
                <p>{new Date(event.date).toLocaleDateString()}</p>
                <p>{event.description || 'No description provided.'}</p>
                <small>{event.teamMembers?.length || 0} members</small>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
