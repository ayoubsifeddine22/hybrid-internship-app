import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserFromToken } from '../../services/auth';
import { adminAPI } from '../../services/api';
import '../../styles/AdminDashboard.css';
import AdminHome from './AdminHome';
import AdminUsers from './AdminUsers';
import AdminOffers from './AdminOffers';
import AdminApplications from './AdminApplications';
import AdminLogs from './AdminLogs';
import AdminSettings from './AdminSettings';
import NotificationCenter from '../Notifications/NotificationCenter';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    loadAdminName();
  }, []);

  const loadAdminName = () => {
    try {
      const user = getUserFromToken();
      setAdminName(user?.name || 'Administrator');
    } catch {
      setAdminName('Administrator');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const handleLogoClick = () => {
    setActiveTab('dashboard');
  };

  return (
    <div className="admin-dashboard">
      {}
      <nav className="admin-navbar">
        <div className="navbar-content">
          <div className="navbar-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
            <h1>InternshipGo</h1>
            <span className="admin-badge">Admin Panel</span>
          </div>
          <div className="navbar-user">
            <span>Admin Account</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      {}
      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`tab-button ${activeTab === 'offers' ? 'active' : ''}`}
          onClick={() => setActiveTab('offers')}
        >
          Offers
        </button>
        <button
          className={`tab-button ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          Applications
        </button>
        <button
          className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Audit Logs
        </button>
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
        <div className="tabs-spacer"></div>
        <NotificationCenter />
      </div>

      {}
      <div className="admin-content">
        {activeTab === 'dashboard' && <AdminHome adminName={adminName} />}
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'offers' && <AdminOffers />}
        {activeTab === 'applications' && <AdminApplications />}
        {activeTab === 'logs' && <AdminLogs />}
        {activeTab === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
};

export default AdminDashboard;

