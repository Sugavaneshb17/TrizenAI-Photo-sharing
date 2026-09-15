import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function TeamEventPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
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

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));

    try {
      await api.post(`/events/${eventId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      event.target.value = '';
      loadData();
    } catch (err) {
      setError(err.message || 'Upload failed');
    }
  };

  if (loading) return <div className="page-state">Loading team event...</div>;
  if (!event) return <div className="page-state">Event not found.</div>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1>{event.name}</h1>
      </div>

      <div className="card form-card">
        <h2>Upload photos</h2>
        <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleUpload} />
      </div>

      {error ? <p className="error-message">{error}</p> : null}

      <div className="card list-card">
        <h2>Your uploads</h2>
        {photos.length === 0 ? (
          <p className="empty-state">No photos uploaded yet.</p>
        ) : (
          <div className="photo-grid">
            {photos.map((photo) => (
              <div className="photo-card" key={photo._id}>
                <img src={photo.storageUrl} alt={photo.originalName} />
                <div className="photo-meta">
                  <strong>{photo.originalName}</strong>
                  <span>{new Date(photo.createdAt).toLocaleDateString()}</span>
                  <span>{photo.isSelected ? 'Selected' : 'Pending review'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
