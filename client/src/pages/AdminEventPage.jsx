import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function AdminEventPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [memberEmail, setMemberEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const eventResponse = await api.get(`/events/${eventId}`);
      setEvent(eventResponse.data.data.event);
      const photoResponse = await api.get(`/events/${eventId}/photos`);
      setPhotos(photoResponse.data.data.photos || []);
    } catch (err) {
      setError(err.message || 'Unable to load event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventId]);

  const handleAddMember = async (event) => {
    event.preventDefault();
    try {
      await api.post('/users/team-members', {
        name: memberEmail.split('@')[0],
        email: memberEmail,
        password: 'Temporary123!',
      });
      await api.post(`/events/${eventId}/members`, { email: memberEmail });
      setMemberEmail('');
      loadData();
    } catch (err) {
      setError(err.message || 'Unable to add team member');
    }
  };

  const handleSelectToggle = async (photoId) => {
    try {
      await api.patch(`/photos/${photoId}/select`);
      loadData();
    } catch (err) {
      setError(err.message || 'Unable to update photo selection');
    }
  };

  const handlePublish = async () => {
    try {
      await api.post(`/events/${eventId}/gallery/publish`, { pin });
      setPin('');
      alert('Gallery published');
    } catch (err) {
      setError(err.message || 'Unable to publish gallery');
    }
  };

  if (loading) return <div className="page-state">Loading event...</div>;
  if (!event) return <div className="page-state">Event not found.</div>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1>{event.name}</h1>
      </div>

      <div className="card info-card">
        <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
        <p><strong>Description:</strong> {event.description || 'No description'}</p>
        <p><strong>Team members:</strong> {event.teamMembers?.map((member) => member.name).join(', ') || 'None assigned'}</p>
      </div>

      <form className="card form-card" onSubmit={handleAddMember}>
        <h2>Add team member</h2>
        <div className="row-inline">
          <input type="email" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} placeholder="member@example.com" required />
          <button type="submit">Add</button>
        </div>
      </form>

      <div className="card form-card">
        <h2>Publish gallery</h2>
        <div className="row-inline">
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN (min 4 digits)" />
          <button type="button" onClick={handlePublish}>Publish</button>
        </div>
      </div>

      {error ? <p className="error-message">{error}</p> : null}

      <div className="card list-card">
        <h2>Uploaded photos</h2>
        {photos.length === 0 ? (
          <p className="empty-state">No photos uploaded yet.</p>
        ) : (
          <div className="photo-grid">
            {photos.map((photo) => (
              <div className="photo-card" key={photo._id}>
                <img src={photo.storageUrl} alt={photo.originalName} />
                <div className="photo-meta">
                  <strong>{photo.originalName}</strong>
                  <span>{photo.uploadedBy?.name || 'Unknown'}</span>
                  <span>{new Date(photo.createdAt).toLocaleDateString()}</span>
                </div>
                <button type="button" className={photo.isSelected ? 'secondary' : ''} onClick={() => handleSelectToggle(photo._id)}>
                  {photo.isSelected ? 'Unselect' : 'Select'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
