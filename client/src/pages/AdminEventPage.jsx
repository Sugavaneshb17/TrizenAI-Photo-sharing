import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import api from '../services/api';

export default function AdminEventPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [memberEmail, setMemberEmail] = useState('');
  const [pin, setPin] = useState('');
  const [galleryUrl, setGalleryUrl] = useState('');
  const [galleryStatus, setGalleryStatus] = useState({ published: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', date: '' });

  const loadData = async () => {
    try {
      const eventResponse = await api.get(`/events/${eventId}`);
      const nextEvent = eventResponse.data.data.event;
      setEvent(nextEvent);
      setEditForm({
        name: nextEvent.name || '',
        description: nextEvent.description || '',
        date: nextEvent.date ? new Date(nextEvent.date).toISOString().slice(0, 10) : '',
      });
      const photoResponse = await api.get(`/events/${eventId}/photos`);
      setPhotos(photoResponse.data.data.photos || []);
      const statusResponse = await api.get(`/events/${eventId}/gallery`);
      setGalleryStatus(statusResponse.data.data || { published: false });
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
      try {
        await api.post('/users/team-members', {
          name: memberEmail.split('@')[0],
          email: memberEmail,
          password: 'Temporary123!',
        });
      } catch (err) {
        if (err?.message !== 'User already exists') {
          throw err;
        }
      }

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
      const response = await api.post(`/events/${eventId}/gallery/publish`, { pin });
      const publishedUrl = response.data.data.galleryUrl;
      setGalleryUrl(publishedUrl);
      setPin('');
      alert(`Gallery published. Open: ${publishedUrl}`);
    } catch (err) {
      setError(err.message || 'Unable to publish gallery');
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await api.patch(`/events/${eventId}`, editForm);
      setEvent(response.data.data.event);
      setIsEditing(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to update event');
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
        <div className="inline-actions">
          <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
          <button type="button" className="secondary-button" onClick={() => setIsEditing((value) => !value)}>
            {isEditing ? 'Cancel edit' : 'Edit event'}
          </button>
        </div>
        <p><strong>Description:</strong> {event.description || 'No description'}</p>
        <p><strong>Team members:</strong> {event.teamMembers?.map((member) => member.name).join(', ') || 'None assigned'}</p>
      </div>

      {isEditing ? (
        <form className="card form-card" onSubmit={handleEditSubmit}>
          <h2>Edit event</h2>
          <label>
            Event name
            <input value={editForm.name} onChange={(e) => setEditForm((current) => ({ ...current, name: e.target.value }))} required />
          </label>
          <label>
            Event date
            <input type="date" value={editForm.date} onChange={(e) => setEditForm((current) => ({ ...current, date: e.target.value }))} required />
          </label>
          <label>
            Description
            <textarea rows="3" value={editForm.description} onChange={(e) => setEditForm((current) => ({ ...current, description: e.target.value }))} />
          </label>
          <div className="row-inline">
            <button type="submit">Save changes</button>
            <button type="button" className="secondary-button" onClick={() => setIsEditing(false)}>
              Close
            </button>
          </div>
        </form>
      ) : null}

      <div className="card info-card">
        <h2>Gallery status</h2>
        <p><strong>Published:</strong> {galleryStatus.published ? 'Yes' : 'No'}</p>
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
        {galleryUrl ? (
          <div style={{ marginTop: '12px' }}>
            <strong>Public gallery URL:</strong>
            <div style={{ wordBreak: 'break-all', marginTop: '6px' }}>{galleryUrl}</div>
          </div>
        ) : null}
      </div>

      {error ? <p className="error-message">{error}</p> : null}

      <div className="card info-card">
        <p><strong>Total uploaded photos:</strong> {photos.length}</p>
        <p><strong>Selected for publishing:</strong> {photos.filter((photo) => photo.isSelected).length}</p>
      </div>

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

      <BackButton to="/admin/dashboard" />
    </div>
  );
}
