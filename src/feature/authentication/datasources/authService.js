import api from 'api/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const extractResponsePayload = (response) => response?.data;

/**
 * Normalize refresh payloads from Laravel ({ data: { ... } }) or flat shapes.
 */
export function normalizeRefreshResponse(body) {
  const payload = body?.data && typeof body.data === 'object' && body.data.access_token != null ? body.data : body;

  return {
    accessToken: payload?.access_token ?? null,
    user: payload?.user ?? null,
    tokenType: payload?.token_type ?? null,
    expiresIn: payload?.expires_in ?? null,
    raw: body
  };
}

/**
 * Normalize password setup completion payloads from Laravel ({ data: { ... } }) or flat shapes.
 */
export function normalizePasswordSetupResponse(body) {
  const payload = body?.data && typeof body.data === 'object' && body.data.next_step != null ? body.data : body;

  return {
    nextStep: payload?.next_step ?? null,
    user: payload?.user ?? null,
    raw: body
  };
}

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
      throw error;
    }
  },

  /**
   * Rotate the HttpOnly refresh session and obtain a new access token.
   * Uses direct fetch (not api.js) to avoid refresh-on-401 recursion.
   * @returns {Promise<{ accessToken: string, user: object|null, tokenType: string|null, expiresIn: number|null, raw: unknown }>}
   */
  async refresh() {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
      const error = new Error('Refresh session is invalid or expired.');
      error.status = response.status;
      error.data = body;
      throw error;
    }

    const normalized = normalizeRefreshResponse(body);

    if (!normalized.accessToken) {
      const error = new Error('Missing access token from refresh response.');
      error.status = response.status;
      error.data = body;
      throw error;
    }

    return normalized;
  },

  /**
   * Complete first-login password setup with a one-time setup token.
   * @param {{ setup_token: string, password: string, password_confirmation: string }} payload
   * @returns {Promise<{ nextStep: string|null, user: object|null, raw: unknown }>}
   */
  async completePasswordSetup(payload) {
    const response = await api.post('/auth/password-setup/complete', payload, { skipAuthRefresh: true });
    const body = extractResponsePayload(response);
    return normalizePasswordSetupResponse(body);
  }
};

export default authService;
