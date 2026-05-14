import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getUserFromToken } from '../services/auth';
import BrowseOffers from '../components/Student/BrowseOffers';
import MyApplications from '../components/Student/MyApplications';
import StudentProfile from '../components/Student/StudentProfile';
import StudentHome from '../components/Student/StudentHome';
import NotificationCenter from '../components/Notifications/NotificationCenter';
import '../styles/Dashboard.css';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [studentName, setStudentName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const user = getUserFromToken();
    if (user) {
      // Extract name from token
      setStudentName(user.name || user.email?.split('@')[0] || 'Student');
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLogoClick = () => {
    setActiveTab('home');
  };

  return (
    <div className="student-dashboard">
      {}
      <nav className="student-navbar">
        <div className="navbar-content">
          <div className="navbar-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
            <h1>InternshipGo</h1>
            <span className="student-badge">Student</span>
          </div>
          <div className="navbar-user">
            <span>Student Account</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      {}
      <div className="student-tabs">
        <button
          className={`tab-button ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          Home
        </button>
        <button
          className={`tab-button ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          Browse Offers
        </button>
        <button
          className={`tab-button ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          My Applications
        </button>
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <div className="tabs-spacer"></div>
        <NotificationCenter />
      </div>

      {}
      <div className="student-content">
        {activeTab === 'home' && <StudentHome studentName={studentName} />}
        {activeTab === 'browse' && <BrowseOffers />}
        {activeTab === 'applications' && <MyApplications />}
        {activeTab === 'profile' && <StudentProfile />}
      </div>
    </div>
  );
};

export default StudentDashboard;

