import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { setAuthToken, getUserFromToken } from '../../services/auth';
import './Auth.css';

const Register = () => {
  // ===== STATE =====
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');  // Company name for enterprises, person's name for students
  const [userType, setUserType] = useState('student');
  const [phone, setPhone] = useState('');  // Phone number for both students and enterprises
  const [companyLocation, setCompanyLocation] = useState('');  // Company location for enterprises only
  const [companyDescription, setCompanyDescription] = useState('');  // Company description for enterprises only
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});  // Track per-field errors

  const navigate = useNavigate();

  // ===== CLIENT-SIDE VALIDATION =====
  const validateForm = () => {
    const newErrors = {};

    // Check all required fields
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!email.includes('@')) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!fullName.trim()) {
      newErrors.fullName = userType === 'enterprise' ? 'Company name is required' : 'Full name is required';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    // Role-specific validation
    if (userType === 'enterprise') {
      if (!companyLocation.trim()) {
        newErrors.companyLocation = 'Company location is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ===== HANDLE SUBMIT =====
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate first
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Build request body based on user type
      let requestData = {
        email,
        password,
        user_type: userType,
        full_name: fullName,
        phone
      };

      // Add role-specific fields
      if (userType === 'enterprise') {
        requestData.company_location = companyLocation;
        requestData.company_description = companyDescription;
      }

      // Call register API
      const response = await authAPI.register(requestData);

      // Debug: Log what backend is returning
      console.log('Register response:', response.data);
      console.log('Full token response:', response.data);

      // Store token
      const token = response.data.token;
      console.log('Token being stored:', token);
      setAuthToken(token);

      // Small delay to ensure token is set in localStorage
      setTimeout(() => {
        // Navigate based on user type
        const user = getUserFromToken();
        console.log('User from token after decode:', user);
        console.log('User role:', user?.role);
        console.log('User user_type:', user?.user_type);
        console.log('userType state variable:', userType);

        if (user?.role === 'student') {
          navigate('/dashboard');
        } else if (user?.role === 'enterprise') {
          navigate('/enterprise/dashboard');
        } else if (user?.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          console.warn('No matching role, using userType state:', userType);
          // Fallback to userType state if role not found
          if (userType === 'student') {
            navigate('/dashboard');
          } else if (userType === 'enterprise') {
            navigate('/enterprise/dashboard');
          } else if (userType === 'admin') {
            navigate('/admin/dashboard');
          }
        }
      }, 100);

    } catch (err) {
      // Handle server errors
      const serverErrors = err.response?.data?.error || 'Registration failed';
      setErrors({ server: serverErrors });
      console.error('Register error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Register</h1>

        {}
        {errors.server && <div className="error-message">{errors.server}</div>}

        <form onSubmit={handleSubmit}>
          {}
          <div className="form-group">
            <label>I am a:</label>
            <select value={userType} onChange={(e) => setUserType(e.target.value)}>
              <option value="student">Student</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div className={`form-group ${errors.fullName ? 'error' : ''}`}>
            <label>{userType === 'enterprise' ? 'Company Name:' : 'Full Name:'}:</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={userType === 'enterprise' ? 'Enter your company name' : 'Enter your full name'}
              className={errors.fullName ? 'input-error' : ''}
            />
            {errors.fullName && <span className="field-error">{errors.fullName}</span>}
          </div>

          <div className={`form-group ${errors.email ? 'error' : ''}`}>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className={`form-group ${errors.password ? 'error' : ''}`}>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (min 6 characters)"
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className={`form-group ${errors.confirmPassword ? 'error' : ''}`}>
            <label>Confirm Password:</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className={errors.confirmPassword ? 'input-error' : ''}
            />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>

          <div className={`form-group ${errors.phone ? 'error' : ''}`}>
            <label>Phone Number:</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className={errors.phone ? 'input-error' : ''}
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>

          {}
          {userType === 'enterprise' && (
            <>
              <div className={`form-group ${errors.companyLocation ? 'error' : ''}`}>
                <label>Company Location:</label>
                <input
                  type="text"
                  value={companyLocation}
                  onChange={(e) => setCompanyLocation(e.target.value)}
                  placeholder="Enter company location (city/country)"
                  className={errors.companyLocation ? 'input-error' : ''}
                />
                {errors.companyLocation && <span className="field-error">{errors.companyLocation}</span>}
              </div>

              <div className={`form-group ${errors.companyDescription ? 'error' : ''}`}>
                <label>Company Description:</label>
                <textarea
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Describe your company (what you do, culture, etc.)"
                  className={errors.companyDescription ? 'input-error' : ''}
                  rows={4}
                />
                {errors.companyDescription && <span className="field-error">{errors.companyDescription}</span>}
              </div>
            </>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
};

export default Register;

