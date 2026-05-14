import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import '../../styles/BrowseOffers.css';

const BrowseOffers = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appliedOffers, setAppliedOffers] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Load offers
      const offersResponse = await studentAPI.getOffers();
      setOffers(offersResponse.data.offers || []);

      // Load applications to check which offers user has applied to
      const applicationsResponse = await studentAPI.getApplications();
      const appliedOfferIds = new Set(applicationsResponse.data.applications.map(app => app.offer_id));
      setAppliedOffers(appliedOfferIds);

      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load offers');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = (offerId) => {
    navigate(`/offer/${offerId}`);
  };

  if (loading) {
    return <div className="browse-container"><p className="loading">Loading offers...</p></div>;
  }

  return (
    <div className="browse-container">
      <div className="browse-header">
        <h2>Available Internship Offers</h2>
        <p>{offers.length} offers available</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {offers.length === 0 ? (
        <div className="no-offers">
          <p>No internship offers available at this time.</p>
        </div>
      ) : (
        <div className="offers-grid">
          {offers.map((offer) => (
            <div key={offer.id} className="offer-card">
              <div className="offer-header">
                <h3>{offer.title}</h3>
                {appliedOffers.has(offer.id) ? (
                  <span className="offer-status already-applied">Already Applied</span>
                ) : (
                  <span className={`offer-status ${offer.status}`}>{offer.status}</span>
                )}
              </div>

              <p className="offer-company">{offer.company_name}</p>

              <p className="offer-description">{offer.description.substring(0, 150)}...</p>

              <div className="offer-details">
                <div className="detail-item">
                  <span className="label">Required Diploma:</span>
                  <span className="value">{offer.required_diploma?.replace(/_/g, ' ').toUpperCase()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Duration:</span>
                  <span className="value">{offer.duration_weeks ? `${offer.duration_weeks} weeks` : 'Not specified'}</span>
                </div>
                {offer.salary_per_month && (
                  <div className="detail-item">
                    <span className="label">Salary/Month:</span>
                    <span className="value">${offer.salary_per_month}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="label">Deadline:</span>
                  <span className="value">{new Date(offer.application_deadline).toLocaleDateString()}</span>
                </div>
              </div>

              {offer.skills && offer.skills.length > 0 && (
                <div className="offer-skills">
                  <p className="skills-label">Required Skills:</p>
                  <div className="skills-list">
                    {offer.skills.map((skill, idx) => (
                      <span key={idx} className="skill-tag">{skill.skill_name}</span>
                    ))}
                  </div>
                </div>
              )}

              <button
                className={`apply-btn ${offer.status !== 'open' || appliedOffers.has(offer.id) ? 'disabled' : ''}`}
                onClick={() => handleApplyClick(offer.id)}
                disabled={offer.status !== 'open' || appliedOffers.has(offer.id)}
              >
                {appliedOffers.has(offer.id) ? 'Already Applied' : offer.status !== 'open' ? 'Position Closed' : 'Apply Now'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseOffers;

