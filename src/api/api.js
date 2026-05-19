import { clearAuthSession, getAuthToken } from 'utils/auth';

// Base API URL from .env or fallback localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Redirect to login if not already on login page
const redirectToLogin = () => {
  if (window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
};

// Build headers with authorization token if present
const buildHeaders = (customHeaders = {}, data) => {
  const token = getAuthToken();
  const headers = {
    Accept: 'application/json',
    ...customHeaders
  };

  // Add JWT Authorization token if present
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Set Content-Type to JSON if not FormData
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;

  // Set Content-Type to JSON if not FormData and not already set
  if (!isFormData && data !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

// Main request handler
const request = async (method, url, data, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers: buildHeaders(options.headers, data),
    body: data === undefined ? undefined : data instanceof FormData ? data : JSON.stringify(data)
  });

  // If unauthorized, clear token and redirect to login
  if (response.status === 401) {
    clearAuthSession();
    redirectToLogin();
    throw new Error('Unauthorized');
  }

  // Detect response type
  const contentType = response.headers.get('content-type') || '';

  const responseData = contentType.includes('application/json') ? await response.json() : await response.text();

  // If not OK, throw error with status and data
  if (!response.ok) {
    const error = new Error('API request failed');
    error.status = response.status;
    error.data = responseData;
    throw error;
  }

  // Return response data, status, and headers
  return {
    data: responseData,
    status: response.status,
    headers: response.headers
  };
};

// API methods
const api = {
  get: (url, options) => request('GET', url, undefined, options),
  post: (url, data, options) => request('POST', url, data, options),
  put: (url, data, options) => request('PUT', url, data, options),
  patch: (url, data, options) => request('PATCH', url, data, options),
  delete: (url, options) => request('DELETE', url, undefined, options)
};

export default api;
