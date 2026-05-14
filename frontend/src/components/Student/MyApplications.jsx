import React, { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import '../../styles/MyApplications.css';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getApplications();
      setApplications(response.data.applications || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load applications');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApplication = async (appId) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;

    try {
      await studentAPI.deleteApplication(appId);
      fetchApplications();
      alert('Application deleted successfully');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete application');
    }
  };

  if (loading) {
    return <div className="applications-container"><p className="loading">Loading applications...</p></div>;
  }

  return (
    <div className="applications-container">
      <div className="applications-header">
        <h2>My Applications</h2>
        <p>{applications.length} application{applications.length !== 1 ? 's' : ''}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {applications.length === 0 ? (
        <div className="no-applications">
          <p>You haven't applied to any offers yet.</p>
          <p>Go to Browse Offers to find internships!</p>
        </div>
      ) : (
        <div className="applications-list">
          {applications.map((app) => (
            <div key={app.id} className="application-card">
              <div className="app-header">
                <div>
                  <h3>{app.offer_title}</h3>
                  <p className="company-name">{app.company_name}</p>
                </div>
                <span className={`app-status ${app.status}`}>{app.status}</span>
              </div>

              <div className="app-details">
                <div className="detail-row">
                  <span className="label">Applied On:</span>
                  <span className="value">{new Date(app.created_at).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Your Score:</span>
                  <span className={`score ${parseFloat(app.total_score) >= 0.8 ? 'excellent' : 'good'}`}>
                    {parseFloat(app.total_score).toFixed(2)} / 1.00
                  </span>
                </div>

                <div className="score-breakdown">
                  <p className="breakdown-title">Score Breakdown:</p>
                  <div className="breakdown-items">
                    <div className="breakdown-item">
                      <span className="label">Skills:</span>
                      <span className="value">{parseFloat(app.skills_score).toFixed(2)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="label">Diploma:</span>
                      <span className="value">{parseFloat(app.diploma_score).toFixed(2)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="label">Location:</span>
                      <span className="value">{parseFloat(app.location_score).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {app.accepted_at && (
                  <div className="accepted-message">
                    <p>🎉 Congratulations! You were accepted on {new Date(app.accepted_at).toLocaleDateString()}</p>
                  </div>
                )}

                {app.rejected_at && (
                  <div className="rejected-message">
                    <p>Unfortunately, your application was rejected on {new Date(app.rejected_at).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              <button
                className="delete-btn"
                onClick={() => handleDeleteApplication(app.id)}
              >
                Delete Application
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyApplications;

