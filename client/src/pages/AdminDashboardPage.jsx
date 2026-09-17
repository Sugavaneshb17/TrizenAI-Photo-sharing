import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import api from '../services/api';

export default function AdminDashboardPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamEmail, setTeamEmail] = useState('');
  const [teamPassword, setTeamPassword] = useState('');
  const navigate = useNavigate();

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

  const handleCreateTeamMember = async (event) => {
    event.preventDefault();
    try {
      await api.post('/users/team-members', {
        name: teamName,
        email: teamEmail,
        password: teamPassword,
      });
      setTeamName('');
      setTeamEmail('');
      setTeamPassword('');
      setError('');
      loadEvents();
    } catch (err) {
      setError(err.message || 'Unable to create team member');
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Delete this event? This action cannot be undone.')) return;

    try {
      await api.delete(`/events/${eventId}`);
      setEvents((current) => current.filter((event) => event._id !== eventId));
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to delete event');
    }
  };

  if (loading) return <div className="page-state">Loading events...</div>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1>Admin dashboard</h1>
      </div>

      <form className="card form-card" onSubmit={handleCreateTeamMember}>
        <h2>Create team member</h2>
        <div className="two-columns">
          <label>
            Team member name
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} required />
          </label>
          <label>
            Team member email
            <input type="email" value={teamEmail} onChange={(e) => setTeamEmail(e.target.value)} required />
          </label>
        </div>
        <label>
          Password
          <input type="password" value={teamPassword} onChange={(e) => setTeamPassword(e.target.value)} required />
        </label>
        <button type="submit">Create team member</button>
      </form>

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
              <div className="event-card" key={event._id}>
                <Link to={`/admin/events/${event._id}`} className="event-link">
                  <h3>{event.name}</h3>
                  <p>{new Date(event.date).toLocaleDateString()}</p>
                  <p>{event.description || 'No description provided.'}</p>
                  <small>{event.teamMembers?.length || 0} members</small>
                </Link>
                <div className="event-actions">
                  <button type="button" className="secondary-button" onClick={() => navigate(`/admin/events/${event._id}`)}>
                    Edit
                  </button>
                  <button type="button" className="danger-button" onClick={() => handleDelete(event._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BackButton to="/login" />
    </div>
  );
}
