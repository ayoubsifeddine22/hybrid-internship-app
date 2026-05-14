import React, { useState, useEffect } from 'react';
import { getUserFromToken } from '../../services/auth';
import { authAPI } from '../../services/api';

const AdminSettings = () => {
  const [view, setView] = useState('profile'); // 'profile' or 'password'
  const [adminInfo, setAdminInfo] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAdminInfo();
  }, []);

  const loadAdminInfo = () => {
    try {
      const user = getUserFromToken();
      setAdminInfo(user);
    } catch {
      setError('Failed to load admin information');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!currentPassword.trim()) {
      setError('Current password is required');
      return;
    }
    if (!newPassword.trim()) {
      setError('New password is required');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await authAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });

      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        setSuccess('');
        setView('profile');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-settings">
      {}
      <div className="settings-nav">
        <button
          className={`settings-btn ${view === 'profile' ? 'active' : ''}`}
          onClick={() => setView('profile')}
        >
          Profile
        </button>
        <button
          className={`settings-btn ${view === 'password' ? 'active' : ''}`}
          onClick={() => setView('password')}
        >
          Change Password
        </button>
      </div>

      {}
      <div className="settings-content">
        {success && <div className="admin-success">{success}</div>}
        {error && <div className="admin-error">{error}</div>}

        {view === 'profile' ? (
          // Profile View
          <div className="profile-view">
            <h3>Account Information</h3>

            {adminInfo ? (
              <div className="profile-card">
                <div className="profile-item">
                  <span className="label">Name:</span>
                  <span className="value">{adminInfo.name}</span>
                </div>
                <div className="profile-item">
                  <span className="label">Email:</span>
                  <span className="value">{adminInfo.email}</span>
                </div>
                <div className="profile-item">
                  <span className="label">Role:</span>
                  <span className="value badge">Administrator</span>
                </div>
                <div className="profile-item">
                  <span className="label">Access Level:</span>
                  <span className="value">Full Platform Access</span>
                </div>

                <div className="profile-section">
                  <h4>Responsibilities</h4>
                  <ul className="responsibilities">
                    <li>✓ Manage all platform users</li>
                    <li>✓ Monitor internship offers</li>
                    <li>✓ Track applications and matches</li>
                    <li>✓ View platform statistics</li>
                    <li>✓ Audit administrative actions</li>
                    <li>✓ Control user access levels</li>
                  </ul>
                </div>

                <div className="profile-section">
                  <h4>Quick Stats</h4>
                  <div className="quick-stats">
                    <div className="stat">
                      <span className="stat-label">Platform Access:</span>
                      <span className="stat-value">Full</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Account Status:</span>
                      <span className="stat-value active">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p>Loading profile information...</p>
            )}
          </div>
        ) : (
          // Password Change View
          <div className="password-view">
            <h3>Change Password</h3>

            <form onSubmit={handleChangePassword} className="password-form">
              <div className="form-group">
                <label htmlFor="current-pwd">Current Password *</label>
                <input
                  id="current-pwd"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-pwd">New Password *</label>
                <input
                  id="new-pwd"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm-pwd">Confirm New Password *</label>
                <input
                  id="confirm-pwd"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <div className="password-requirements">
                <h5>Password Requirements:</h5>
                <ul>
                  <li>At least 6 characters long</li>
                  <li>Cannot be the same as your current password</li>
                  <li>Both new password fields must match</li>
                </ul>
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;

