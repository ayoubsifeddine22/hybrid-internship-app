import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const AdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '' });
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [appDetail, setAppDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadApplications();
  }, [filters]);

  useEffect(() => {
    setTimeout(() => {
      const adminApps = document.querySelector('.admin-applications');
      const container = document.querySelector('.applications-container');

      console.log('=== PARENT & CONTAINER WIDTH DEBUG ===');
      if (adminApps) {
        console.log('admin-applications width:', window.getComputedStyle(adminApps).width);
        console.log('admin-applications offsetWidth:', adminApps.offsetWidth);
      }
      if (container) {
        console.log('applications-container width:', window.getComputedStyle(container).width);
        console.log('applications-container offsetWidth:', container.offsetWidth);
        console.log('applications-container parentElement:', container.parentElement.className);
        console.log('applications-container parent width:', window.getComputedStyle(container.parentElement).width);
      }
      console.log('=====================================');
    }, 500);
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;

      const response = await adminAPI.getAllApplications(params);
      setApplications(response.data.applications || []);
      setError('');
    } catch (err) {
      setError('Failed to load applications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAppClick = async (appId) => {
    setSelectedAppId(appId);
    try {
      setDetailLoading(true);
      const response = await adminAPI.getApplicationDetails(appId);
      setAppDetail(response.data);
    } catch (err) {
      setError('Failed to load application details');
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  if (loading) return <div className="admin-applications"><p>Loading applications...</p></div>;

  return (
    <div className="admin-applications">
      {error && <div className="admin-error">{error}</div>}

      <div className="applications-header">
        <h2>Applications Management</h2>
        <div className="filters">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="applications-container">
        {}
        <div className="applications-list">
          {applications.length === 0 ? (
            <p className="no-data">No applications found</p>
          ) : (
            applications.map(app => (
              <div
                key={app.id}
                className={`application-card ${selectedAppId === app.id ? 'selected' : ''}`}
                onClick={() => handleAppClick(app.id)}
              >
                <div className="application-header">
                  <h4>{app.full_name}</h4>
                  <div className={`application-status ${app.status}`}>{app.status.toUpperCase()}</div>
                </div>
                <div className="application-info">
                  <span className="offer-title">{app.offer_title}</span>
                  <span className="student-email">{app.email}</span>
                </div>
                <div className="application-date">
                  Applied: {new Date(app.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>

        {}
        {selectedAppId ? (
          detailLoading ? (
            <div className="application-detail"><p>Loading details...</p></div>
          ) : appDetail ? (
            <div className="application-detail">
              <h3>{appDetail.application.full_name}</h3>

              <div className="detail-section">
                <h4>Applicant Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Email:</span>
                    <span className="value">{appDetail.application.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Student ID:</span>
                    <span className="value">{appDetail.application.student_user_id}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Application Details</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Offer:</span>
                    <span className="value">{appDetail.application.offer_title}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Status:</span>
                    <span className={`value status ${appDetail.application.status}`}>
                      {appDetail.application.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Applied Date:</span>
                    <span className="value">{new Date(appDetail.application.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Score Breakdown</h4>
                <div className="score-items">
                  <div className="score-row">
                    <span className="score-label">Skills Score:</span>
                    <span className="score-value">{(parseFloat(appDetail.application.skills_score) || 0).toFixed(2)}</span>
                  </div>
                  <div className="score-row">
                    <span className="score-label">Diploma Score:</span>
                    <span className="score-value">{(parseFloat(appDetail.application.diploma_score) || 0).toFixed(2)}</span>
                  </div>
                  <div className="score-row">
                    <span className="score-label">Location Score:</span>
                    <span className="score-value">{(parseFloat(appDetail.application.location_score) || 0).toFixed(2)}</span>
                  </div>
                  <div className="score-row total">
                    <span className="score-label">Total Score:</span>
                    <span className="score-value">{(parseFloat(appDetail.application.total_score) || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="application-detail placeholder"><p>Failed to load application</p></div>
          )
        ) : (
          <div className="application-detail placeholder">
            <p>Select an application to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApplications;

