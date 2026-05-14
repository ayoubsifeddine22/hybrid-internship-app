import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { setAuthToken, getUserFromToken } from '../../services/auth';
import './Auth.css';

const Login = () => {
  // ===== STATE =====
  // useState creates a state variable and a function to update it
  // Syntax: const [variable, setVariable] = useState(initialValue);

  const [email, setEmail] = useState('');           // Store email input
  const [password, setPassword] = useState('');     // Store password input
  const [loading, setLoading] = useState(false);    // Show loading state during request
  const [error, setError] = useState('');           // Show error messages

  const navigate = useNavigate();                   // Navigate to different pages

  // ===== HANDLE SUBMIT =====
  const handleSubmit = async (e) => {
    e.preventDefault();  // Prevent page reload

    // Clear previous errors
    setError('');
    setLoading(true);

    try {
      // Step 1: Call login API
      const response = await authAPI.login(email, password);

      // Step 2: Extract token from response
      const token = response.data.token;

      // Step 3: Store token in localStorage
      setAuthToken(token);

      // Step 4: Small delay to ensure token is set in localStorage
      setTimeout(() => {
        // Step 5: Get user info from token to know which dashboard to go to
        const user = getUserFromToken();
        console.log('User from token:', user); // Debug log

        // Step 6: Navigate to appropriate dashboard based on user role
        if (user?.role === 'student') {
          navigate('/dashboard');
        } else if (user?.role === 'enterprise') {
          navigate('/enterprise/dashboard');
        } else if (user?.role === 'admin') {
          navigate('/admin/dashboard');
        }
      }, 100);

    } catch (err) {
      // Handle errors from API call
      const errorMsg = err.response?.data?.error || 'Login failed';
      setError(errorMsg);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Login</h1>

        {}
        {error && <div className="error-message">{error}</div>}

        {}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {}
        <p className="auth-link">
          Don't have an account? <a href="/register">Register here</a>
        </p>
      </div>
    </div>
  );
};

export default Login;

