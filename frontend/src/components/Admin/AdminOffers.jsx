import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const AdminOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '' });
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [offerDetail, setOfferDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadOffers();
  }, [filters]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;

      const response = await adminAPI.getAllOffers(params);
      setOffers(response.data.offers || []);
      setError('');
    } catch (err) {
      setError('Failed to load offers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOfferClick = async (offerId) => {
    setSelectedOfferId(offerId);
    try {
      setDetailLoading(true);
      const response = await adminAPI.getOfferDetails(offerId);
      setOfferDetail(response.data);
    } catch (err) {
      setError('Failed to load offer details');
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  if (loading) return <div className="admin-offers"><p>Loading offers...</p></div>;

  return (
    <div className="admin-offers">
      {error && <div className="admin-error">{error}</div>}

      <div className="offers-header">
        <h2>Internship Offers Management</h2>
        <div className="filters">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="filled">Filled</option>
          </select>
        </div>
      </div>

      <div className="offers-container">
        {}
        <div className="offers-list">
          {offers.length === 0 ? (
            <p className="no-data">No offers found</p>
          ) : (
            offers.map(offer => (
              <div
                key={offer.id}
                className={`offer-card ${selectedOfferId === offer.id ? 'selected' : ''}`}
                onClick={() => handleOfferClick(offer.id)}
              >
                <div className="offer-header">
                  <h4>{offer.title}</h4>
                  <div className={`offer-status ${offer.status}`}>{offer.status.toUpperCase()}</div>
                </div>
                <div className="offer-info">
                  <span className="company">{offer.company_name}</span>
                  <span className="diploma">{offer.required_diploma}</span>
                </div>
                <div className="offer-deadline">
                  Deadline: {new Date(offer.application_deadline).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>

        {}
        {selectedOfferId ? (
          detailLoading ? (
            <div className="offer-detail"><p>Loading details...</p></div>
          ) : offerDetail ? (
            <div className="offer-detail">
              <h3>{offerDetail.offer.title}</h3>

              <div className="detail-section">
                <h4>Offer Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Company:</span>
                    <span className="value">{offerDetail.offer.company_name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Status:</span>
                    <span className={`value status ${offerDetail.offer.status}`}>{offerDetail.offer.status.toUpperCase()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Required Diploma:</span>
                    <span className="value">{offerDetail.offer.required_diploma}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Duration:</span>
                    <span className="value">{offerDetail.offer.duration_weeks} weeks</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Salary/Month:</span>
                    <span className="value">€{offerDetail.offer.salary_per_month}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Start Date:</span>
                    <span className="value">{new Date(offerDetail.offer.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Application Deadline:</span>
                    <span className="value">{new Date(offerDetail.offer.application_deadline).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Created:</span>
                    <span className="value">{new Date(offerDetail.offer.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="description-section">
                  <h5>Description</h5>
                  <p>{offerDetail.offer.description}</p>
                </div>
              </div>

              {}
              {offerDetail.skills.length > 0 && (
                <div className="detail-section">
                  <h4>Required Skills</h4>
                  <div className="skills-badges">
                    {offerDetail.skills.map((skill, idx) => (
                      <div key={idx} className="skill-badge">
                        <span className="skill-name">{skill.skill_name}</span>
                        <span className="skill-weight">{(parseFloat(skill.skill_weight) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {}
              {offerDetail.applications.length > 0 && (
                <div className="detail-section">
                  <h4>Applications ({offerDetail.applications.length})</h4>
                  <div className="applications-list">
                    {offerDetail.applications.map(app => (
                      <div key={app.id} className="app-row">
                        <div className="app-info">
                          <div className="student-name">{app.full_name}</div>
                          <div className="student-email">{app.email}</div>
                        </div>
                        <div className="app-score">Score: {(parseFloat(app.total_score) || 0).toFixed(2)}</div>
                        <div className={`app-status ${app.status}`}>{app.status.toUpperCase()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {offerDetail.applications.length === 0 && (
                <div className="detail-section">
                  <p className="no-applications">No applications yet</p>
                </div>
              )}
            </div>
          ) : (
            <div className="offer-detail placeholder"><p>Failed to load offer</p></div>
          )
        ) : (
          <div className="offer-detail placeholder">
            <p>Select an offer to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOffers;

