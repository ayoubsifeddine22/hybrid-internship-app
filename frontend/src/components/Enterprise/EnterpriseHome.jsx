import React from 'react';
import '../../styles/EnterpriseHome.css';

const EnterpriseHome = ({ companyName }) => {
  return (
    <div className="enterprise-home">
      {}
      <section className="welcome-section-enterprise">
        <div className="welcome-content-enterprise">
          <h1>Welcome {companyName}!</h1>
          <p>Connect with top talent and build your internship program with our smart matching platform.</p>
        </div>
      </section>

      {}
      <section className="how-to-post-section">
        <div className="how-to-post-container">
          <h2 className="section-title-enterprise">How to Post Your Internship Offers</h2>
          <div className="how-to-post-grid">
            <div className="how-to-post-card">
              <div className="step-number-enterprise">1</div>
              <h3>Create Your Offer</h3>
              <p>Navigate to "My Offers" and click "Post New Internship". Fill in the position details including title, description, requirements, and salary.</p>
            </div>
            <div className="how-to-post-card">
              <div className="step-number-enterprise">2</div>
              <h3>Specify Requirements</h3>
              <p>Define the skills you need, minimum education level, and preferred work location. Set the weight for each criteria to match our intelligent algorithm.</p>
            </div>
            <div className="how-to-post-card">
              <div className="step-number-enterprise">3</div>
              <h3>Smart Matching</h3>
              <p>Our app automatically scores applications based on your requirements. Candidates with the highest scores appear at the top of your applications list.</p>
            </div>
          </div>

          <div className="scoring-rules-enterprise">
            <h3>How Scoring Works</h3>
            <p><strong>First to 0.8:</strong> The first candidate to reach a match score of 0.8 or higher (80/100) instantly wins the internship offer.</p>
            <p><strong>After Deadline:</strong> If no candidate reaches 0.8 by the application deadline, the app automatically selects the candidate with the highest score.</p>
          </div>

          <div className="ai-feature-box-enterprise">
            <div className="ai-feature-content-enterprise">
              <h4>Coming Soon: AI-Powered Candidate Screening</h4>
              <p>Our advanced AI will automatically analyze candidate CVs and match them against your requirements without manual review. Extract skills, experience, and qualifications instantly. Get the best matches ranked by relevance, saving you hours on screening. Intelligent pre-filtering ensures you only see candidates who truly fit your criteria!</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EnterpriseHome;

