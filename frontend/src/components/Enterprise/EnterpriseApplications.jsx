import React, { useEffect, useState } from 'react';
import { enterpriseAPI } from '../../services/api';
import './EnterpriseApplications.css';

const EnterpriseApplications = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const offersResponse = await enterpriseAPI.getOffers();
      const offers = offersResponse.data.offers || [];

      const appResponses = await Promise.all(
        offers.map(async (offer) => {
          try {
            const response = await enterpriseAPI.getOfferApplications(offer.id);
            const applications = response.data.applications || [];
            return applications.map((application) => ({
              ...application,
              offerTitle: offer.title
            }));
          } catch {
            return [];
          }
        })
      );

      setRows(appResponses.flat());
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="enterprise-tab-container"><p className="enterprise-loading">Loading applications...</p></div>;
  }

  return (
    <div className="enterprise-tab-container">
      <div className="enterprise-tab-header">
        <h2>Applications</h2>
        <p>{rows.length} application{rows.length !== 1 ? 's' : ''}</p>
      </div>

      {error && <div className="enterprise-error">{error}</div>}

      {rows.length === 0 ? (
        <div className="enterprise-empty">No applications available yet.</div>
      ) : (
        <div className="enterprise-table-wrap">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Offer</th>
                <th>Student</th>
                <th>Email</th>
                <th>Status</th>
                <th>Total Score</th>
                <th>Applied At</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.offerTitle}</td>
                  <td>{row.full_name}</td>
                  <td>{row.email}</td>
                  <td><span className={`enterprise-badge-status app-${row.status}`}>{row.status}</span></td>
                  <td>{Number(row.total_score).toFixed(2)}</td>
                  <td>{new Date(row.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EnterpriseApplications;

