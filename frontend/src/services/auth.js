import { jwtDecode } from 'jwt-decode';

// Store user info from token
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  }
};

// Get stored token
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Get user info from token
export const getUserFromToken = () => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    // Normalize role field - could be 'role' or 'user_type' depending on backend
    return {
      ...decoded,
      role: decoded.role || decoded.user_type
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Clear everything (logout)
export const logout = () => {
  localStorage.removeItem('token');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Check if user has specific role
export const hasRole = (role) => {
  const user = getUserFromToken();
  return user && user.role === role;
};

export default {
  setAuthToken,
  getAuthToken,
  getUserFromToken,
  logout,
  isAuthenticated,
  hasRole
};

