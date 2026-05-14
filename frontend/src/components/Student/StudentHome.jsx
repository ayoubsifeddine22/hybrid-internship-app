import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import '../../styles/StudentHome.css';

const StudentHome = ({ studentName }) => {
  const navigate = useNavigate();
  const [featuredOffers, setFeaturedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appliedOffers, setAppliedOffers] = useState(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load offers
      const offersResponse = await studentAPI.getOffers();
      setFeaturedOffers(offersResponse.data.offers.slice(0, 3));

      // Load applications to check which offers user has applied to
      const applicationsResponse = await studentAPI.getApplications();
      const appliedOfferIds = new Set(applicationsResponse.data.applications.map(app => app.offer_id));
      setAppliedOffers(appliedOfferIds);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-home">
      {}
      <section className="welcome-section">
        <div className="welcome-content">
          <h1>Welcome {studentName}!</h1>
          <p>Discover internship opportunities that match your skills and career goals.</p>
        </div>
      </section>

      {}
      <section className="featured-section-home">
        <div className="featured-container">
          <h2 className="featured-title">Featured Opportunities</h2>
          <p className="featured-subtitle">Explore our most popular internship positions</p>

          {loading ? (
            <div className="loading-state">Loading featured offers...</div>
          ) : featuredOffers.length > 0 ? (
            <div className="offers-grid-home">
              {featuredOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="offer-card-home"
                  onClick={() => navigate(`/offer/${offer.id}`)}
                  role="button"
                  tabIndex="0"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`/offer/${offer.id}`);
                    }
                  }}
                >
                  <div className="offer-header-home">
                    <h3>{offer.title}</h3>
                    {appliedOffers.has(offer.id) ? (
                      <span className="status-badge already-applied">Already Applied</span>
                    ) : (
                      <span className="status-badge open">{offer.status}</span>
                    )}
                  </div>
                  <p className="company-name">{offer.company_name}</p>
                  <p className="offer-description">{offer.description?.substring(0, 100)}...</p>
                  <div className="offer-meta-home">
                    <span className="location">Location: {offer.company_location}</span>
                    <span className="salary">${offer.salary_per_month}/month</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-offers-state">
              <p>No internship offers available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {}
      <section className="how-it-works-section">
        <div className="how-it-works-container">
          <h2 className="section-title">How InternshipGo Works</h2>
          <div className="how-it-works-grid">
            <div className="how-it-works-card">
              <div className="step-number">1</div>
              <h3>Browse Opportunities</h3>
              <p>Explore internship positions from top companies. Each position lists required skills, education level, and salary.</p>
            </div>
            <div className="how-it-works-card">
              <div className="step-number">2</div>
              <h3>Apply & Get Scored</h3>
              <p>Submit your application with your education level, select matching skills, and specify your location preference. Our algorithm instantly calculates your match score.</p>
            </div>
            <div className="how-it-works-card">
              <div className="step-number">3</div>
              <h3>Smart Matching</h3>
              <p>Your application is ranked against others based on skills alignment, education match, and location fit. The best match wins the internship!</p>
            </div>
          </div>

          <div className="ai-feature-box">
            <div className="ai-feature-content">
              <h4>Coming Soon: AI-Powered CV Analysis</h4>
              <p>Upload your CV in PDF format and our advanced AI will automatically extract your skills and qualifications. We'll calculate your match score instantly without you having to manually select skills. Get perfectly matched to opportunities in seconds!</p>
            </div>
          </div>

          <div className="scoring-explanation">
            <h3>Understanding Your Match Score</h3>
            <div className="scoring-details">
              <div className="score-item">
                <span className="score-label">Skills Match (40%)</span>
                <span className="score-value">0-100 points</span>
                <p>Based on how well your selected skills match the position requirements. Each skill has a weight set by the employer.</p>
              </div>
              <div className="score-item">
                <span className="score-label">Education Fit (30%)</span>
                <span className="score-value">0-100 points</span>
                <p>Compares your education level with the minimum requirement. Meeting or exceeding the requirement earns full points.</p>
              </div>
              <div className="score-item">
                <span className="score-label">Location Preference (30%)</span>
                <span className="score-value">0-100 points</span>
                <p>Evaluates how well your location preference aligns with the job location. Closer proximity scores higher.</p>
              </div>
              <div className="score-total">
                <span className="score-label"><strong>Total Match Score</strong></span>
                <span className="score-value"><strong>0-100 points</strong></span>
                <p><strong>The student with the highest score wins the internship!</strong> Scores are calculated instantly when you apply.</p>
                <p><strong>Auto-Acceptance:</strong> If you reach a score of 80 or higher (0.8+), you automatically win the internship without waiting for other applications!</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StudentHome;

