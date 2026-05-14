import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getUserFromToken } from '../services/auth';
import { studentAPI } from '../services/api';
import '../styles/HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [featuredOffers, setFeaturedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const authenticated = isAuthenticated();
  const user = getUserFromToken();

  useEffect(() => {
    loadFeaturedOffers();
  }, []);

  const loadFeaturedOffers = async () => {
    try {
      const response = await studentAPI.getOffers();
      // Get first 3 offers
      setFeaturedOffers(response.data.offers.slice(0, 3));
    } catch (err) {
      console.error('Error loading offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToOffers = () => {
    if (authenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="home-page">
      {}
      <nav className="home-navbar">
        <div className="navbar-left">
          <h1 className="logo">InternshipGo</h1>
        </div>
        <div className="navbar-right">
          {authenticated ? (
            <>
              <span className="welcome-text">Welcome, {user?.name || user?.email}</span>
              <button className="nav-btn primary-btn" onClick={() => navigate('/dashboard')}>
                Dashboard
              </button>
            </>
          ) : (
            <>
              <button className="nav-btn" onClick={() => navigate('/login')}>
                Login
              </button>
              <button className="nav-btn primary-btn" onClick={() => navigate('/register')}>
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      {}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Find Your Perfect Internship</h1>
          <p className="hero-subtitle">
            Connect with leading companies and launch your career. Browse internship opportunities tailored to your skills and interests.
          </p>
          <button className="cta-btn" onClick={handleNavigateToOffers}>
            {authenticated ? 'View All Offers' : 'Get Started'}
          </button>
        </div>
        <div className="hero-image">
          <div className="hero-placeholder">
            <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
              <rect width="400" height="300" fill="#E0E7FF"/>
              <circle cx="100" cy="100" r="40" fill="#2563EB" opacity="0.3"/>
              <circle cx="300" cy="200" r="50" fill="#2563EB" opacity="0.2"/>
              <rect x="150" y="80" width="120" height="140" fill="#2563EB" opacity="0.25" rx="10"/>
            </svg>
          </div>
        </div>
      </section>

      {}
      <section className="featured-section">
        <div className="featured-container">
          <h2 className="featured-title">Featured Opportunities</h2>
          <p className="featured-subtitle">Explore our most popular internship positions</p>

          {loading ? (
            <div className="loading-state">Loading featured offers...</div>
          ) : featuredOffers.length > 0 ? (
            <div className="offers-grid">
              {featuredOffers.map((offer) => (
                <div key={offer.id} className="offer-card-home">
                  <div className="offer-header-home">
                    <h3>{offer.title}</h3>
                    <span className="status-badge open">{offer.status}</span>
                  </div>
                  <p className="company-name">{offer.company_name}</p>
                  <p className="offer-description">{offer.description?.substring(0, 100)}...</p>
                  <div className="offer-meta">
                    <span className="location">📍 {offer.location}</span>
                    <span className="salary">{offer.salary_range}</span>
                  </div>
                  <button
                    className="view-btn"
                    onClick={handleNavigateToOffers}
                  >
                    View Details
                  </button>
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
      <section className="about-section">
        <div className="about-container">
          <h2 className="about-title">Why Choose InternshipGo?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Smart Matching</h3>
              <p>Our intelligent algorithm matches your skills and interests with the perfect internships, saving you time and effort.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏢</div>
              <h3>Top Companies</h3>
              <p>Access internships from leading companies across various industries and domains.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Career Growth</h3>
              <p>Gain practical experience, build your portfolio, and launch your professional career with confidence.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Community</h3>
              <p>Join thousands of students and professionals building their careers through meaningful internship experiences.</p>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Start Your Internship Journey?</h2>
          <p>Browse opportunities, apply to internships, and grow your career today.</p>
          <button className="cta-btn-large" onClick={handleNavigateToOffers}>
            {authenticated ? 'Explore Opportunities' : 'Sign Up Now'}
          </button>
        </div>
      </section>

      {}
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2026 InternshipGo. All rights reserved.</p>
          <p>Connecting talent with opportunity.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

