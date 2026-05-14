import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import '../../styles/OfferDetail.css';

const OfferDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState(null); // 'already_applied', 'submitted', etc.
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    diploma_level: '',
    selected_skills: [],
    distance_range: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    loadOfferDetails();
  }, [id]);

  const loadOfferDetails = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getOfferDetails(id);
      setOffer(response.data.offer);
      setError(null);

      // Check if user has already applied to this offer
      try {
        const applicationsResponse = await studentAPI.getApplications();
        const hasApplied = applicationsResponse.data.applications.some(app => app.offer_id === parseInt(id));
        if (hasApplied) {
          setApplicationStatus('already_applied');
        }
      } catch (err) {
        console.error('Error checking applications:', err);
      }
    } catch (err) {
      console.error('Error loading offer:', err);
      setError('Failed to load offer details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'selected_skills') {
      // Handle multi-select for skills
      if (checked) {
        setApplicationData(prev => ({
          ...prev,
          selected_skills: [...prev.selected_skills, value]
        }));
      } else {
        setApplicationData(prev => ({
          ...prev,
          selected_skills: prev.selected_skills.filter(skill => skill !== value)
        }));
      }
    } else {
      setApplicationData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate form
    if (!applicationData.diploma_level || applicationData.selected_skills.length === 0 || !applicationData.distance_range) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await studentAPI.submitApplication({
        offer_id: parseInt(id),
        diploma_level: applicationData.diploma_level,
        selected_skills: applicationData.selected_skills,
        distance_range: applicationData.distance_range
      });
      setSubmitSuccess(true);
      setApplicationStatus('already_applied');
      setShowApplicationForm(false);
      setApplicationData({
        diploma_level: '',
        selected_skills: [],
        distance_range: ''
      });
      // Reset success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      console.error('Error submitting application:', err);
      const errorMsg = err.response?.data?.error || 'Failed to submit application. Please try again.';
      setSubmitError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="offer-detail-container">
        <div className="loading-state">Loading offer details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="offer-detail-container">
        <button className="back-button" onClick={() => navigate(-1)}>← Back</button>
        <div className="error-state">{error}</div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="offer-detail-container">
        <button className="back-button" onClick={() => navigate(-1)}>← Back</button>
        <div className="error-state">Offer not found.</div>
      </div>
    );
  }

  return (
    <div className="offer-detail-container">
      <button className="back-button" onClick={() => navigate(-1)}>← Back</button>

      {submitSuccess && (
        <div className="success-message">
          Application submitted successfully!
        </div>
      )}

      <div className="offer-detail-content">
        {}
        <div className="offer-header-detail">
          <div className="header-left">
            <h1>{offer.title}</h1>
            <p className="company-name-detail">{offer.company_name}</p>
            {applicationStatus === 'already_applied' ? (
              <span className="status-badge-detail already-applied">Already Applied</span>
            ) : (
              <span className="status-badge-detail open">{offer.status}</span>
            )}
          </div>
          {applicationStatus !== 'already_applied' && (
            <button
              className={`apply-button ${showApplicationForm ? 'active' : ''}`}
              onClick={() => setShowApplicationForm(!showApplicationForm)}
            >
              {showApplicationForm ? 'Close' : '+ Apply Now'}
            </button>
          )}
        </div>

        <div className="offer-detail-grid">
          {}
          <div className="offer-main">
            {}
            <div className="quick-info">
              <div className="info-item">
                <span className="info-label">Location</span>
                <span className="info-value">{offer.company_location}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Salary</span>
                <span className="info-value">${offer.salary_per_month || 'Not specified'}/month</span>
              </div>
              <div className="info-item">
                <span className="info-label">Duration</span>
                <span className="info-value">{offer.duration_weeks || 'Not specified'} weeks</span>
              </div>
              <div className="info-item">
                <span className="info-label">Education Level</span>
                <span className="info-value">{offer.required_diploma ? offer.required_diploma.replace('_', ' ').toUpperCase() : 'Not specified'}</span>
              </div>
            </div>

            {}
            <div className="section">
              <h2>About the Role</h2>
              <p>{offer.description}</p>
            </div>

            {}
            {offer.skills && offer.skills.length > 0 && (
              <div className="section">
                <h2>Required Skills</h2>
                <div className="skills-list">
                  {offer.skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag">{skill.skill_name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {}
          {showApplicationForm && (
            <div className="application-form-sidebar">
              <div className="application-form">
                <h3>Apply for this position</h3>
                {submitError && (
                  <div className="error-message-inline">
                    {submitError}
                  </div>
                )}
                <form onSubmit={handleSubmitApplication}>
                  <div className="form-group">
                    <label htmlFor="diploma_level">Education Level *</label>
                    <select
                      id="diploma_level"
                      name="diploma_level"
                      value={applicationData.diploma_level}
                      onChange={handleApplicationChange}
                      required
                    >
                      <option value="">Select your education level</option>
                      <option value="high_school">High School</option>
                      <option value="2nd_year">2nd Year</option>
                      <option value="bachelor">Bachelor's Degree</option>
                      <option value="master">Master's Degree</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Required Skills *</label>
                    <div className="skills-checkbox-group">
                      {offer.skills && offer.skills.length > 0 ? (
                        offer.skills.map((skill) => (
                          <label key={skill.skill_name} className="checkbox-label">
                            <input
                              type="checkbox"
                              name="selected_skills"
                              value={skill.skill_name}
                              checked={applicationData.selected_skills.includes(skill.skill_name)}
                              onChange={handleApplicationChange}
                            />
                            <span>{skill.skill_name}</span>
                          </label>
                        ))
                      ) : (
                        <p>No skills listed for this offer</p>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="distance_range">Preferred Distance *</label>
                    <select
                      id="distance_range"
                      name="distance_range"
                      value={applicationData.distance_range}
                      onChange={handleApplicationChange}
                      required
                    >
                      <option value="">Select distance range</option>
                      <option value="exact">Exact Location</option>
                      <option value="0_50km">0-50 km</option>
                      <option value="50_100km">50-100 km</option>
                      <option value="100_200km">100-200 km</option>
                      <option value="200km_plus">200+ km</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="submit-button"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferDetail;

