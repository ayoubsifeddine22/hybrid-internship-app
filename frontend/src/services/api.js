import axios from 'axios';

// Create axios instance with base URL pointing to your backend
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== AUTH ENDPOINTS =====
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (email, password) => API.post('/auth/login', { email, password }),
  changePassword: (data) => API.put('/auth/change-password', data),
};

// ===== STUDENT ENDPOINTS =====
export const studentAPI = {
  // Offers
  getOffers: () => API.get('/student/offers'),
  getOfferDetails: (id) => API.get(`/student/offers/${id}`),

  // Applications
  submitApplication: (data) => API.post('/student/applications', data),
  getApplications: () => API.get('/student/applications'),
  getApplicationDetails: (id) => API.get(`/student/applications/${id}`),
  deleteApplication: (id) => API.delete(`/student/applications/${id}`),

  // Profile
  getProfile: () => API.get('/student/profile'),
  updateEducation: (data) => API.put('/student/profile/education', data),
  updateLocation: (data) => API.put('/student/profile/location', data),
  updateSkills: (skills) => API.put('/student/profile/skills', { skills }),
};

// ===== ENTERPRISE ENDPOINTS =====
export const enterpriseAPI = {
  // Offers
  getOffers: () => API.get('/enterprise/offers'),
  createOffer: (data) => API.post('/enterprise/offers', data),
  getOfferDetails: (id) => API.get(`/enterprise/offers/${id}`),
  updateOffer: (id, data) => API.put(`/enterprise/offers/${id}`, data),
  deleteOffer: (id) => API.delete(`/enterprise/offers/${id}`),

  // Applications
  getOfferApplications: (id) => API.get(`/enterprise/offers/${id}/applications`),
  getApplicationDetails: (offerId, appId) => API.get(`/enterprise/offers/${offerId}/applications/${appId}`),

  // Profile
  getProfile: () => API.get('/enterprise/profile'),
  updateCompanyInfo: (data) => API.put('/enterprise/profile/company', data),
  updateContactInfo: (data) => API.put('/enterprise/profile/contact', data),
};

// ===== ADMIN ENDPOINTS =====
export const adminAPI = {
  // Users
  getAllUsers: (filters = {}) => API.get('/admin/users', { params: filters }),
  getUserDetails: (id) => API.get(`/admin/users/${id}`),
  updateUserStatus: (id, is_active) => API.put(`/admin/users/${id}/status`, { is_active }),

  // Offers
  getAllOffers: (filters = {}) => API.get('/admin/offers', { params: filters }),
  getOfferDetails: (id) => API.get(`/admin/offers/${id}`),

  // Applications
  getAllApplications: (filters = {}) => API.get('/admin/applications', { params: filters }),
  getApplicationDetails: (id) => API.get(`/admin/applications/${id}`),

  // Logs & Stats
  getAuditLogs: (filters = {}) => API.get('/admin/logs', { params: filters }),
  getStats: () => API.get('/admin/stats'),
};

// ===== NOTIFICATION ENDPOINTS =====
export const notificationAPI = {
  getNotifications: (filters = {}) => API.get('/notifications', { params: filters }),
  markAsRead: (id) => API.put(`/notifications/${id}`, { is_read: true }),
  deleteNotification: (id) => API.delete(`/notifications/${id}`),
};

export default API;

