import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({ user_type: '', is_active: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.user_type) params.user_type = filters.user_type;
      if (filters.is_active !== '') params.is_active = filters.is_active;

      const response = await adminAPI.getAllUsers(params);
      setUsers(response.data.users || []);
      setError('');
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = async (user) => {
    try {
      setDetailLoading(true);
      const response = await adminAPI.getUserDetails(user.id);
      setSelectedUser({ ...response.data.user, profile: response.data.profile });
    } catch (err) {
      setError('Failed to load user details');
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleStatus = (user) => {
    setConfirmAction({
      user_id: user.id,
      action: user.is_active ? 'deactivate' : 'activate',
      user_name: user.full_name
    });
  };

  const confirmToggleStatus = async () => {
    if (!confirmAction) return;

    try {
      const new_status = confirmAction.action === 'activate';
      await adminAPI.updateUserStatus(confirmAction.user_id, new_status);

      setSuccess(`User ${confirmAction.action === 'activate' ? 'activated' : 'deactivated'} successfully`);
      setConfirmAction(null);

      // Update UI
      setUsers(users.map(u =>
        u.id === confirmAction.user_id ? { ...u, is_active: new_status } : u
      ));

      if (selectedUser?.id === confirmAction.user_id) {
        setSelectedUser({ ...selectedUser, is_active: new_status });
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user status');
      setConfirmAction(null);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  if (loading) return <div className="admin-users"><p>Loading users...</p></div>;

  return (
    <div className="admin-users">
      {success && <div className="admin-success">{success}</div>}
      {error && <div className="admin-error">{error}</div>}

      {confirmAction && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <h3>Confirm Action</h3>
            <p>Are you sure you want to <strong>{confirmAction.action}</strong> {confirmAction.user_name}?</p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button className="btn-confirm" onClick={confirmToggleStatus}>
                {confirmAction.action === 'activate' ? 'Activate' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="users-header">
        <h2>User Management</h2>
        <div className="filters">
          <select
            value={filters.user_type}
            onChange={(e) => handleFilterChange('user_type', e.target.value)}
            className="filter-select"
          >
            <option value="">All User Types</option>
            <option value="student">Students</option>
            <option value="enterprise">Enterprises</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={filters.is_active}
            onChange={(e) => handleFilterChange('is_active', e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <div className="users-container">
        {}
        <div className="users-list">
          {users.length === 0 ? (
            <p className="no-data">No users found</p>
          ) : (
            users.map(user => (
              <div
                key={user.id}
                className={`user-card ${selectedUser?.id === user.id ? 'selected' : ''}`}
                onClick={() => handleUserClick(user)}
              >
                <div className="user-header">
                  <div className="user-name">{user.full_name}</div>
                  <div className={`user-status ${user.is_active ? 'active' : 'inactive'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="user-info">
                  <span className="user-type">{user.user_type.toUpperCase()}</span>
                  <span className="user-email">{user.email}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {}
        {selectedUser ? (
          <div className="user-detail">
            {detailLoading ? (
              <p>Loading details...</p>
            ) : (
              <>
                <h3>{selectedUser.full_name}</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Email:</span>
                    <span className="value">{selectedUser.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">User Type:</span>
                    <span className="value">{selectedUser.user_type.toUpperCase()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Status:</span>
                    <span className={`value status ${selectedUser.is_active ? 'active' : 'inactive'}`}>
                      {selectedUser.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Joined:</span>
                    <span className="value">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {selectedUser.profile && (
                  <div className="profile-section">
                    <h4>Profile Information</h4>
                    <div className="detail-grid">
                      {selectedUser.user_type === 'student' ? (
                        <>
                          <div className="detail-item">
                            <span className="label">Education Level:</span>
                            <span className="value">{selectedUser.profile.education_level || 'N/A'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="label">Graduation Year:</span>
                            <span className="value">{selectedUser.profile.graduation_year || 'N/A'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="label">Location:</span>
                            <span className="value">{selectedUser.profile.location || 'N/A'}</span>
                          </div>
                        </>
                      ) : selectedUser.user_type === 'enterprise' ? (
                        <>
                          <div className="detail-item">
                            <span className="label">Company:</span>
                            <span className="value">{selectedUser.profile.company_name || 'N/A'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="label">Industry:</span>
                            <span className="value">{selectedUser.profile.industry || 'N/A'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="label">Contact Person:</span>
                            <span className="value">{selectedUser.profile.contact_person_name || 'N/A'}</span>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                )}

                <div className="action-buttons">
                  <button
                    className={`btn-status ${selectedUser.is_active ? 'deactivate' : 'activate'}`}
                    onClick={() => handleToggleStatus(selectedUser)}
                  >
                    {selectedUser.is_active ? 'Deactivate User' : 'Activate User'}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="user-detail placeholder">
            <p>Select a user to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;

