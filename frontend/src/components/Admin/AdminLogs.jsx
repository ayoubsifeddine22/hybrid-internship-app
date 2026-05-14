import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ action_type: '' });
  const [actionTypes, setActionTypes] = useState([]);

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (filters.action_type) params.action_type = filters.action_type;

      const response = await adminAPI.getAuditLogs(params);
      const fetchedLogs = response.data.logs || [];
      setLogs(fetchedLogs);

      // Extract unique action types
      const types = [...new Set(fetchedLogs.map(log => log.action_type))];
      setActionTypes(types);
      setError('');
    } catch (err) {
      setError('Failed to load audit logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'USER_STATUS_CHANGED':
        return '👤';
      case 'USER_CREATED':
        return '➕';
      case 'OFFER_CREATED':
        return '📋';
      case 'OFFER_UPDATED':
        return '✏️';
      case 'OFFER_DELETED':
        return '🗑️';
      case 'APPLICATION_REVIEWED':
        return '📋';
      default:
        return '📋';
    }
  };

  if (loading) return <div className="admin-logs"><p>Loading audit logs...</p></div>;

  return (
    <div className="admin-logs">
      {error && <div className="admin-error">{error}</div>}

      <div className="logs-header">
        <h2>Audit Logs</h2>
        <div className="filters">
          <select
            value={filters.action_type}
            onChange={(e) => handleFilterChange('action_type', e.target.value)}
            className="filter-select"
          >
            <option value="">All Actions</option>
            {actionTypes.map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="logs-container">
        {logs.length === 0 ? (
          <p className="no-data">No audit logs found</p>
        ) : (
          <div className="logs-table">
            <div className="logs-header-row">
              <div className="col-timestamp">Timestamp</div>
              <div className="col-action">Action</div>
              <div className="col-description">Description</div>
              <div className="col-target">Target</div>
            </div>
            {logs.map(log => (
              <div key={log.id} className="log-row">
                <div className="col-timestamp">
                  {new Date(log.created_at).toLocaleString()}
                </div>
                <div className="col-action">
                  <span className="action-badge">
                    <span className="action-icon">{getActionIcon(log.action_type)}</span>
                    {log.action_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="col-description">{log.description}</div>
                <div className="col-target">
                  <span className="target-info">
                    {log.target_table} ID: {log.target_id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="logs-info">
        <p>Showing {logs.length} log entries. Older entries are automatically archived.</p>
      </div>
    </div>
  );
};

export default AdminLogs;

