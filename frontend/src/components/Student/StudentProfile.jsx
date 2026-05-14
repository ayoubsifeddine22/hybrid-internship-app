import React, { useState, useEffect } from 'react';
import { studentAPI, authAPI } from '../../services/api';
import { getUserFromToken } from '../../services/auth';
import '../../styles/StudentProfile.css';

const StudentProfile = () => {
  const [view, setView] = useState('main'); // 'main', 'edit-info', 'change-password'
  const [editTab, setEditTab] = useState('education');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

  // Edit info state
  const [diplomaLevel, setDiplomaLevel] = useState('high_school');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [graduationYear, setGraduationYear] = useState(new Date().getFullYear());
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const userInfo = getUserFromToken();
    console.log('User info from token:', userInfo); // DEBUG
    setUser(userInfo);
    loadProfileData();
  }, []);

  useEffect(() => {
    if (view === 'edit-info') {
      loadProfileData();
    }
  }, [view]);

  const loadProfileData = async () => {
    try {
      const response = await studentAPI.getProfile();
      const profile = response.data.profile;
      const skillsList = response.data.skills || [];
      const userData = response.data.user;

      // Update user with full_name from API response if not in token
      if (userData?.full_name && (!user || !user.name)) {
        setUser(prev => ({
          ...prev,
          name: userData.full_name,
          email: userData.email
        }));
      }

      setDiplomaLevel(profile.diploma_level || 'high_school');
      setFieldOfStudy(profile.field_of_study || '');
      setUniversityName(profile.university_name || '');
      setGraduationYear(profile.graduation_year || new Date().getFullYear());
      setCity(profile.city || '');
      setCountry(profile.country || '');
      setSkills(skillsList);
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await authAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      setMessage('Password changed successfully!');
      await loadProfileData();
      setTimeout(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setMessage('');
        setView('main');
      }, 2000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEducation = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await studentAPI.updateEducation({
        diploma_level: diplomaLevel,
        field_of_study: fieldOfStudy,
        university_name: universityName,
        graduation_year: graduationYear
      });
      setMessage('Education updated successfully!');
      await loadProfileData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to update education');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await studentAPI.updateLocation({ city, country });
      setMessage('Location updated successfully!');
      await loadProfileData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
    if (skills.includes(newSkill)) {
      setMessage('This skill is already added');
      return;
    }

    try {
      setLoading(true);
      await studentAPI.updateSkills([...skills, newSkill]);
      setSkills([...skills, newSkill]);
      setNewSkill('');
      setMessage('Skill added successfully!');
      await loadProfileData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to add skill');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    try {
      setLoading(true);
      const updatedSkills = skills.filter(s => s !== skillToRemove);
      await studentAPI.updateSkills(updatedSkills);
      setSkills(updatedSkills);
      setMessage('Skill removed successfully!');
      await loadProfileData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to remove skill');
    } finally {
      setLoading(false);
    }
  };

  // MAIN PROFILE VIEW
  if (view === 'main') {
    const getDateJoined = () => {
      if (user?.iat) {
        return new Date(user.iat * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      return 'N/A';
    };

    const getUserTypeBadge = () => {
      const type = user?.role || user?.user_type || 'user';
      return type.charAt(0).toUpperCase() + type.slice(1);
    };

    const getInitials = () => {
      if (!user?.name) return '?';
      const parts = user.name.split(' ');
      if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
      }
      return user.name.charAt(0).toUpperCase();
    };

    return (
      <div className="profile-container">
        <div className="profile-main">
          <div className="profile-header-card">
            <div className="profile-avatar">
              {getInitials()}
            </div>
            <div className="profile-info-main">
              <h2>{user?.name || user?.email || 'Loading...'}</h2>
              <p className="email">{user?.email || 'No email'}</p>
              <div className="profile-meta">
                <span className="meta-item">
                  <strong>Account Type:</strong> {getUserTypeBadge()}
                </span>
                <span className="meta-item">
                  <strong>Joined:</strong> {getDateJoined()}
                </span>
              </div>
            </div>
          </div>

          {message && <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>{message}</div>}

          <div className="profile-actions">
            <button className="action-btn change-password-btn" onClick={() => setView('change-password')}>
              Change Password
            </button>
            <button className="action-btn edit-info-btn" onClick={() => setView('edit-info')}>
              Edit Information
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CHANGE PASSWORD VIEW
  if (view === 'change-password') {
    return (
      <div className="profile-container">
        <div className="profile-section">
          <button className="back-btn" onClick={() => { setView('main'); setMessage(''); }}>
            ← Back to Profile
          </button>

          <h2>Change Password</h2>
          {message && <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>{message}</div>}

          <form onSubmit={handleChangePassword} className="password-form">
            <div className="form-group">
              <label>Current Password:</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>New Password:</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password:</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // EDIT INFO VIEW
  if (view === 'edit-info') {
    return (
      <div className="profile-container">
        <div className="profile-section">
          <button className="back-btn" onClick={() => { setView('main'); setMessage(''); }}>
            ← Back to Profile
          </button>

          <h2>Edit Additional Information</h2>
          {message && <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>{message}</div>}

          <div className="edit-tabs">
            <button
              className={`edit-tab-btn ${editTab === 'education' ? 'active' : ''}`}
              onClick={() => setEditTab('education')}
            >
              Education
            </button>
            <button
              className={`edit-tab-btn ${editTab === 'location' ? 'active' : ''}`}
              onClick={() => setEditTab('location')}
            >
              Location
            </button>
            <button
              className={`edit-tab-btn ${editTab === 'skills' ? 'active' : ''}`}
              onClick={() => setEditTab('skills')}
            >
              Skills
            </button>
          </div>

          {}
          {editTab === 'education' && (
            <form onSubmit={handleUpdateEducation} className="edit-form">
              <div className="form-group">
                <label>Diploma Level:</label>
                <select value={diplomaLevel} onChange={(e) => setDiplomaLevel(e.target.value)}>
                  <option value="high_school">High School</option>
                  <option value="2nd_year">2nd Year</option>
                  <option value="bachelor">Bachelor</option>
                  <option value="master">Master</option>
                </select>
              </div>

              <div className="form-group">
                <label>Field of Study:</label>
                <input
                  type="text"
                  value={fieldOfStudy}
                  onChange={(e) => setFieldOfStudy(e.target.value)}
                  placeholder="e.g., Computer Science"
                />
              </div>

              <div className="form-group">
                <label>University Name:</label>
                <input
                  type="text"
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                  placeholder="e.g., MIT"
                />
              </div>

              <div className="form-group">
                <label>Graduation Year:</label>
                <input
                  type="number"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(parseInt(e.target.value))}
                  min={1990}
                  max={new Date().getFullYear() + 10}
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Updating...' : 'Save Education'}
              </button>
            </form>
          )}

          {}
          {editTab === 'location' && (
            <form onSubmit={handleUpdateLocation} className="edit-form">
              <div className="form-group">
                <label>City:</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., San Francisco"
                />
              </div>

              <div className="form-group">
                <label>Country:</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g., USA"
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Updating...' : 'Save Location'}
              </button>
            </form>
          )}

          {}
          {editTab === 'skills' && (
            <div className="edit-form">
              <div className="skills-display">
                <p className="skills-title">Your Current Skills:</p>
                {skills.length === 0 ? (
                  <p className="no-skills">No skills added yet</p>
                ) : (
                  <div className="skills-list">
                    {skills.map((skill, idx) => (
                      <div key={idx} className="skill-item">
                        <span>{skill}</span>
                        <button
                          className="remove-skill-btn"
                          onClick={() => handleRemoveSkill(skill)}
                          disabled={loading}
                          type="button"
                          title="Remove skill"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="add-skill-group">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a new skill (e.g., React, Python)"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                />
                <button onClick={handleAddSkill} disabled={loading} type="button">
                  Add Skill
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
};

export default StudentProfile;

