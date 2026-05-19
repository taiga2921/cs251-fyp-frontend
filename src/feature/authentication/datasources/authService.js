import api from 'api/api';

const extractResponsePayload = (response) => response?.data;

const authService = {
  /**
   * Invalidate the current JWT on the backend.
   * @returns {Promise<unknown>} Parsed API response body
   */
  async logout() {
    try {
      const response = await api.post('/auth/logout');
      return extractResponsePayload(response);
    } catch (error) {
      // 401 / expired token: api.js may already clear session and redirect; still propagate
      // so the controller can finish local cleanup in finally.
      throw error;
    }
  }
};

export default authService;
