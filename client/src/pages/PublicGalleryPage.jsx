import { useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function PublicGalleryPage() {
  const { publicToken } = useParams();
  const [pin, setPin] = useState('');
  const [galleryAccess, setGalleryAccess] = useState('');
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchGalleryPhotos = async (token) => {
    try {
      const response = await api.get(`/public/gallery/${publicToken}/photos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPhotos(response.data.data.photos || []);
    } catch (err) {
      setError(err.message || 'Unable to load gallery');
    }
  };

  const handlePinSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/public/gallery/${publicToken}/verify`, { pin });
      const token = response.data.data.accessToken;
      setGalleryAccess(token);
      await fetchGalleryPhotos(token);
    } catch (err) {
      setError(err.message || 'Invalid PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell gallery-shell">
      {!galleryAccess ? (
        <form className="card auth-card" onSubmit={handlePinSubmit}>
          <h1>Gallery access</h1>
          <label>
            Enter PIN
            <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} required />
          </label>
          {error ? <p className="error-message">{error}</p> : null}
          <button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Access gallery'}</button>
        </form>
      ) : (
        <div className="card list-card">
          <h2>Published gallery</h2>
          {photos.length === 0 ? (
            <p className="empty-state">No photos selected for this gallery.</p>
          ) : (
            <div className="photo-grid">
              {photos.map((photo) => (
                <div className="photo-card" key={photo._id}>
                  <img src={photo.storageUrl} alt={photo.originalName} />
                  <div className="photo-meta">
                    <strong>{photo.originalName}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
