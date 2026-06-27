import { beforeEach, describe, expect, it } from 'vitest';

import {
  AUTH_TOKEN_KEY,
  clearAuthSession,
  getAuthToken,
  setAuthToken
} from 'utils/auth';

describe('auth token memory cache (M2 migration)', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAuthSession();
  });

  it('returns memory token before localStorage fallback', () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'stored-token');
    setAuthToken('memory-token');

    expect(getAuthToken()).toBe('memory-token');
  });

  it('falls back to localStorage when memory is cleared', () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'stored-only');
    clearAuthSession();
    localStorage.setItem(AUTH_TOKEN_KEY, 'stored-only');

    expect(getAuthToken()).toBe('stored-only');
  });

  it('clears both memory and localStorage on clearAuthSession', () => {
    setAuthToken('to-clear');
    clearAuthSession();

    expect(getAuthToken()).toBeNull();
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });
});
