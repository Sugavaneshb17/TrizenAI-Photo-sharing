import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminEventPage from './pages/AdminEventPage';
import LoginPage from './pages/LoginPage';
import PublicGalleryPage from './pages/PublicGalleryPage';
import RegisterPage from './pages/RegisterPage';
import TeamDashboardPage from './pages/TeamDashboardPage';
import TeamEventPage from './pages/TeamEventPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/gallery/:publicToken" element={<PublicGalleryPage />} />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events/:eventId"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminEventPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/team/dashboard"
            element={
              <ProtectedRoute requiredRole="TEAM_MEMBER">
                <TeamDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team/events/:eventId"
            element={
              <ProtectedRoute requiredRole="TEAM_MEMBER">
                <TeamEventPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
