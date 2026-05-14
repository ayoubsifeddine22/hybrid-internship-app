import React, { useEffect, useState } from 'react';
import { authAPI, enterpriseAPI } from '../../services/api';
import '../../styles/EnterpriseProfile.css';

const EnterpriseProfile = ({ onProfileUpdated }) => {
  const [view, setView] = useState('main');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPersonEmail, setContactPersonEmail] = useState('');
  const [contactPersonPhone, setContactPersonPhone] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPhone, setAccountPhone] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const loadCompanyData = async () => {
    try {
      const response = await enterpriseAPI.getProfile();
      const profile = response.data?.profile || {};
      const user = response.data?.user || {};

      setCompanyName(profile.company_name || user.full_name || '');
      setCompanyLocation(profile.company_location || '');
      setCompanyDescription(profile.company_description || '');
      setCompanyWebsite(profile.company_website || '');
      setContactPersonName(profile.contact_person_name || '');
      setContactPersonEmail(profile.contact_person_email || '');
      setContactPersonPhone(profile.contact_person_phone || '');
      setAccountEmail(user.email || '');
      setAccountPhone(user.phone || '');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to load profile');
    }
  };

  useEffect(() => {
    loadCompanyData();
  }, []);

  useEffect(() => {
    if (view === 'edit-details') {
      loadCompanyData();
    }
  }, [view]);

  const getInitials = () => {
    const label = companyName || accountEmail || 'E';
    const parts = String(label).trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return String(label)[0]?.toUpperCase() || 'E';
  };

  const handleUpdateDetails = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await enterpriseAPI.updateCompanyInfo({
        company_name: companyName,
        company_location: companyLocation,
        company_description: companyDescription,
        company_website: companyWebsite
      });
      await enterpriseAPI.updateContactInfo({
        contact_person_name: contactPersonName,
        contact_person_email: contactPersonEmail,
        contact_person_phone: contactPersonPhone
      });
      await loadCompanyData();
      setMessage('Company details updated successfully!');
      if (typeof onProfileUpdated === 'function') onProfileUpdated();
      setTimeout(() => {
        setMessage('');
        setView('main');
      }, 1200);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to update company details');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await authAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      setMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setMessage('');
        setView('main');
      }, 1200);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'main') {
    return (
      <div className="profile-container">
        <div className="profile-main">
          <div className="profile-header-card">
            <div className="profile-avatar">{getInitials()}</div>
            <div className="profile-info-main">
              <h2>{companyName || accountEmail || 'Enterprise Account'}</h2>
              <p className="profile-email">{accountEmail || 'No email on file'}</p>
              <p className="profile-joined">{accountPhone ? `Phone: ${accountPhone}` : 'No phone on file'}</p>
            </div>
          </div>

          {message && <div className="message">{message}</div>}

          <div className="profile-summary-grid">
            <div className="profile-summary-card"><span className="profile-summary-label">Location</span><strong>{companyLocation || '-'}</strong></div>
            <div className="profile-summary-card"><span className="profile-summary-label">Website</span>{companyWebsite ? <a href={companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`} target="_blank" rel="noopener noreferrer">{companyWebsite}</a> : <strong>-</strong>}</div>
            <div className="profile-summary-card"><span className="profile-summary-label">Contact Person</span><strong>{contactPersonName || '-'}</strong></div>
            <div className="profile-summary-card"><span className="profile-summary-label">Contact Email</span><strong>{contactPersonEmail || '-'}</strong></div>
          </div>

          <div className="profile-actions">
            <button className="btn-edit" onClick={() => setView('edit-details')}>Edit Company Details</button>
            <button className="btn-password" onClick={() => setView('change-password')}>Change Password</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'edit-details') {
    return (
      <div className="profile-container">
        <div className="profile-edit">
          <button className="back-btn" type="button" onClick={() => setView('main')}>← Back to Profile</button>
          <h2>Edit Company Details</h2>
          {message && <div className="message">{message}</div>}

          <form onSubmit={handleUpdateDetails}>
            <div className="form-section">
              <div className="form-group"><label>Company Name</label><input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required /></div>
              <div className="form-group"><label>Location</label><input type="text" value={companyLocation} onChange={(e) => setCompanyLocation(e.target.value)} required /></div>
              <div className="form-group"><label>Website</label><input type="text" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="https://..." /></div>
              <div className="form-group"><label>Description</label><textarea value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} rows="4" /></div>
            </div>

            <h3 className="profile-subheading">Contact Person</h3>
            <div className="form-section">
              <div className="form-group"><label>Contact Person Name</label><input type="text" value={contactPersonName} onChange={(e) => setContactPersonName(e.target.value)} /></div>
              <div className="form-group"><label>Contact Person Email</label><input type="email" value={contactPersonEmail} onChange={(e) => setContactPersonEmail(e.target.value)} /></div>
              <div className="form-group"><label>Contact Person Phone</label><input type="tel" value={contactPersonPhone} onChange={(e) => setContactPersonPhone(e.target.value)} /></div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
              <button type="button" className="btn-cancel" onClick={() => setView('main')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-edit">
        <button className="back-btn" type="button" onClick={() => setView('main')}>← Back to Profile</button>
        <h2>Change Password</h2>
        {message && <div className="message">{message}</div>}

        <form onSubmit={handleChangePassword}>
          <div className="form-section">
            <div className="form-group"><label>Current Password</label><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></div>
            <div className="form-group"><label>New Password</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div>
            <div className="form-group"><label>Confirm Password</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-save" disabled={loading}>{loading ? 'Updating...' : 'Update Password'}</button>
            <button type="button" className="btn-cancel" onClick={() => setView('main')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnterpriseProfile;

