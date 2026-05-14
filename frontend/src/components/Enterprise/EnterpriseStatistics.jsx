import React, { useState, useEffect } from 'react';
import { enterpriseAPI } from '../../services/api';
import './EnterpriseStatistics.css';

const EnterpriseStatistics = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const offersResponse = await enterpriseAPI.getOffers();
      const offersData = offersResponse.data || { offers: [] };

      // For each filled offer, fetch applications to get winner details and score
      const offersWithDetails = await Promise.all(
        (offersData.offers || []).map(async (offer) => {
          let winnerName = null;
          let winnerScore = null;
          let statusTag = 'Pending';

          if (offer.filled_at && offer.selected_student_id) {
            try {
              const appResponse = await enterpriseAPI.getOfferApplications(offer.id);
              const appData = appResponse.data || { applications: [] };
              const winningApp = (appData.applications || []).find(
                app => app.student_id === offer.selected_student_id
              );

              if (winningApp) {
                winnerName = winningApp.full_name;
                winnerScore = winningApp.total_score;
                statusTag = winnerScore >= 0.8 ? 'Granted by Excellence' : 'Granted';
              }
            } catch (err) {
              console.error(`Failed to fetch applications for offer ${offer.id}:`, err);
              statusTag = offer.status === 'filled' ? 'Granted' : 'Pending';
            }
          }

          return {
            ...offer,
            winnerName,
            winnerScore,
            statusTag
          };
        })
      );

      setOffers(offersWithDetails);
      setError(null);
    } catch (err) {
      console.error('Statistics fetch error:', err);
      setError(err.message || 'Failed to load statistics');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusTagClass = (tag) => {
    switch (tag) {
      case 'Pending':
        return 'status-pending';
      case 'Granted by Excellence':
        return 'status-excellence';
      case 'Granted':
        return 'status-granted';
      default:
        return 'status-pending';
    }
  };

  if (loading) {
    return (
      <div className="statistics-container">
        <div className="statistics-header">
          <h2>Statistics & History</h2>
          <p>All internship offers and their status</p>
        </div>
        <div className="loading">Loading statistics...</div>
      </div>
    );
  }

  return (
    <div className="statistics-container">
      <div className="statistics-header">
        <h2>Statistics & History</h2>
        <p>All internship offers and their status</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {offers.length === 0 ? (
        <div className="empty-state">
          <p>No offers yet. Start by creating your first internship offer!</p>
        </div>
      ) : (
        <div className="statistics-table-wrapper">
          <table className="statistics-table">
            <thead>
              <tr>
                <th>Offer Title</th>
                <th>Status</th>
                <th>Winner Name</th>
                <th>Date Filled</th>
                <th>Posted Date</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.id} className={`offer-row ${offer.statusTag === 'Pending' ? 'pending-row' : ''}`}>
                  <td className="offer-title">{offer.title}</td>
                  <td>
                    <span className={`status-badge ${getStatusTagClass(offer.statusTag)}`}>
                      {offer.statusTag}
                    </span>
                  </td>
                  <td className="winner-name">
                    {offer.winnerName ? (
                      <>
                        <span>{offer.winnerName}</span>
                        {offer.winnerScore !== null && (
                          <span className="winner-score"> (Score: {(offer.winnerScore * 100).toFixed(1)}%)</span>
                        )}
                      </>
                    ) : (
                      <span className="no-winner">-</span>
                    )}
                  </td>
                  <td>{formatDate(offer.filled_at)}</td>
                  <td>{formatDate(offer.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EnterpriseStatistics;

