import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserFromToken } from '../../services/auth';
import { enterpriseAPI } from '../../services/api';
import '../../styles/EnterpriseDashboard.css';
import EnterpriseHome from './EnterpriseHome';
import EnterpriseProfile from './EnterpriseProfile';
import EnterpriseStatistics from './EnterpriseStatistics';
import EnterpriseOffers from './EnterpriseOffers';
import EnterpriseApplications from './EnterpriseApplications';
import NotificationCenter from '../Notifications/NotificationCenter';

const EnterpriseDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    loadCompanyName();
  }, []);

  const loadCompanyName = async () => {
    try {
      const response = await enterpriseAPI.getProfile();
      const profile = response.data?.profile;
      const user = response.data?.user;
      setCompanyName(profile?.company_name || user?.full_name || getUserFromToken()?.name || 'Enterprise');
    } catch {
      const fallbackUser = getUserFromToken();
      setCompanyName(fallbackUser?.name || 'Enterprise');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const handleLogoClick = () => {
    setActiveTab('home');
  };

  return (
    <div className="enterprise-dashboard">
      {}
      <nav className="enterprise-navbar">
        <div className="navbar-content">
          <div className="navbar-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
            <h1>InternshipGo</h1>
            <span className="enterprise-badge">Enterprise</span>
          </div>
          <div className="navbar-user">
            <span>Enterprise Account</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      {}
      <div className="enterprise-tabs">
        <button
          className={`tab-button ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          Home
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
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Company Details
        </button>
        <button
          className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          Statistics
        </button>
        <div className="tabs-spacer"></div>
        <NotificationCenter />
      </div>

      {}
      <div className="enterprise-content">
        {activeTab === 'home' && <EnterpriseHome companyName={companyName} />}
        {activeTab === 'offers' && <EnterpriseOffers />}
        {activeTab === 'applications' && <EnterpriseApplications />}
        {activeTab === 'profile' && <EnterpriseProfile />}
        {activeTab === 'statistics' && <EnterpriseStatistics />}
      </div>
    </div>
  );
};

export default EnterpriseDashboard;

