import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, getUserFromToken } from './services/auth';

// Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Pages
import StudentDashboard from './pages/StudentDashboard';
import OfferDetail from './components/Student/OfferDetail';
import EnterpriseDashboard from './components/Enterprise/EnterpriseDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';

// Protected Route Component - Only authenticated users can access
const ProtectedRoute = ({ children, requiredRole }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  const user = getUserFromToken();
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/offer/:id"
          element={
            <ProtectedRoute requiredRole="student">
              <OfferDetail />
            </ProtectedRoute>
          }
        />

        {}
        <Route
          path="/enterprise/dashboard"
          element={
            <ProtectedRoute requiredRole="enterprise">
              <EnterpriseDashboard />
            </ProtectedRoute>
          }
        />

        {}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;

