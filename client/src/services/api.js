import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const isPublicGalleryRequest = config?.url?.includes('/public/gallery/');
  const token = localStorage.getItem('token');

  if (token && !isPublicGalleryRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message || 'Something went wrong. Please try again.';

    const isPublicGalleryRequest = error?.config?.url?.includes('/public/gallery/');

    if (error?.response?.status === 401 && !isPublicGalleryRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(new Error(message));
  },
);

export default api;
