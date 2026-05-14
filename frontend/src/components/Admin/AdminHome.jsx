import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const AdminHome = ({ adminName }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStats();
      setStats(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="admin-home"><p>Loading statistics...</p></div>;

  const userStats = stats?.users || [];
  const offerStats = stats?.offers || [];
  const appStats = stats?.applications || [];
  const platformStats = stats?.platform_stats || {};

  const getStatCount = (arr, type) => arr.find(s => s.user_type === type || s.status === type)?.count || 0;

  const studentCount = getStatCount(userStats, 'student');
  const enterpriseCount = getStatCount(userStats, 'enterprise');
  const adminCount = getStatCount(userStats, 'admin');

  const openOffers = getStatCount(offerStats, 'open');
  const closedOffers = getStatCount(offerStats, 'closed');
  const filledOffers = platformStats.filled_offers || 0;

  const pendingApps = getStatCount(appStats, 'pending');
  const acceptedApps = getStatCount(appStats, 'accepted');
  const rejectedApps = getStatCount(appStats, 'rejected');

  return (
    <div className="admin-home">
      <div className="admin-welcome">
        <h2>Welcome, {adminName}</h2>
        <p>Platform Overview and Statistics</p>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {}
      <div className="admin-stats-grid">
        {}
        <div className="stats-section">
          <h3>Users</h3>
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-value">{studentCount}</div>
              <div className="stat-label">Students</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{enterpriseCount}</div>
              <div className="stat-label">Enterprises</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{adminCount}</div>
              <div className="stat-label">Admins</div>
            </div>
            <div className="stat-card highlight">
              <div className="stat-value">{studentCount + enterpriseCount + adminCount}</div>
              <div className="stat-label">Total Users</div>
            </div>
          </div>
        </div>

        {}
        <div className="stats-section">
          <h3>Internship Offers</h3>
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-value">{openOffers}</div>
              <div className="stat-label">Open</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{closedOffers}</div>
              <div className="stat-label">Closed</div>
            </div>
            <div className="stat-card success">
              <div className="stat-value">{filledOffers}</div>
              <div className="stat-label">Filled</div>
            </div>
            <div className="stat-card highlight">
              <div className="stat-value">{openOffers + closedOffers + filledOffers}</div>
              <div className="stat-label">Total Offers</div>
            </div>
          </div>
        </div>

        {}
        <div className="stats-section">
          <h3>Applications</h3>
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-value">{pendingApps}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-card success">
              <div className="stat-value">{acceptedApps}</div>
              <div className="stat-label">Accepted</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{rejectedApps}</div>
              <div className="stat-label">Rejected</div>
            </div>
            <div className="stat-card highlight">
              <div className="stat-value">{pendingApps + acceptedApps + rejectedApps}</div>
              <div className="stat-label">Total Applications</div>
            </div>
          </div>
        </div>

        {}
        <div className="stats-section">
          <h3>Platform Overview</h3>
          <div className="overview-items">
            <div className="overview-item">
              <span className="label">Success Rate (Filled Offers):</span>
              <span className="value">
                {openOffers + closedOffers + filledOffers > 0
                  ? ((filledOffers / (openOffers + closedOffers + filledOffers)) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            <div className="overview-item">
              <span className="label">Average Application Score:</span>
              <span className="value">{(parseFloat(platformStats.average_application_score) || 0).toFixed(2)}</span>
            </div>
            <div className="overview-item">
              <span className="label">Application Acceptance Rate:</span>
              <span className="value">
                {pendingApps + acceptedApps + rejectedApps > 0
                  ? ((acceptedApps / (pendingApps + acceptedApps + rejectedApps)) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;

