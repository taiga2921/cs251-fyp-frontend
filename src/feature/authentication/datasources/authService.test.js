import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { normalizeRefreshResponse } from './authService';

describe('authService.normalizeRefreshResponse', () => {
  it('accepts Laravel envelope shape', () => {
    const result = normalizeRefreshResponse({
      success: true,
      data: {
        access_token: 'jwt-new',
        token_type: 'bearer',
        expires_in: 3600,
        user: { id: 1, email: 'a@b.com' }
      }
    });

    expect(result.accessToken).toBe('jwt-new');
    expect(result.user).toEqual({ id: 1, email: 'a@b.com' });
    expect(result.tokenType).toBe('bearer');
    expect(result.expiresIn).toBe(3600);
  });

  it('accepts flat response shape', () => {
    const result = normalizeRefreshResponse({
      access_token: 'jwt-flat',
      token_type: 'bearer',
      expires_in: 1800,
      user: { id: 2 }
    });

    expect(result.accessToken).toBe('jwt-flat');
    expect(result.user).toEqual({ id: 2 });
  });
});

describe('authService.refresh', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('calls /auth/refresh with credentials and no Authorization header', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { access_token: 'refreshed', token_type: 'bearer', expires_in: 3600, user: { id: 1 } }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const authService = (await import('./authService')).default;
    const result = await authService.refresh();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/refresh$/),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include'
      })
    );
    expect(result.accessToken).toBe('refreshed');
  });

  it('throws on refresh failure without storing tokens', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: false, message: 'invalid' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const authService = (await import('./authService')).default;
    await expect(authService.refresh()).rejects.toMatchObject({ status: 401 });
  });
});
