import { beforeEach, describe, expect, it } from 'vitest';

import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  clearAuthSession,
  getAuthToken,
  isAuthUserTwoFactorEnabled,
  setAuthToken,
  setAuthUser,
  validateAuthSession
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

describe('isAuthUserTwoFactorEnabled', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAuthSession();
  });

  it('returns true only when two_factor_enabled is strictly true', () => {
    setAuthUser({ two_factor_enabled: true });
    expect(isAuthUserTwoFactorEnabled()).toBe(true);
  });

  it('returns false when two_factor_enabled is false', () => {
    setAuthUser({ two_factor_enabled: false });
    expect(isAuthUserTwoFactorEnabled()).toBe(false);
  });

  it('returns false when two_factor_enabled is missing', () => {
    setAuthUser({ id: '1', email: 'user@example.com' });
    expect(isAuthUserTwoFactorEnabled()).toBe(false);
  });

  it('returns false when auth user is null', () => {
    expect(isAuthUserTwoFactorEnabled()).toBe(false);
  });
});

describe('validateAuthSession', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAuthSession();
  });

  it('returns false when auth_user lacks two_factor_enabled', () => {
    setAuthToken('jwt-token');
    setAuthUser({
      id: '1',
      email: 'user@example.com',
      setup_required: false,
      role: { name: 'Admin' }
    });

    expect(validateAuthSession()).toBe(false);
  });

  it('returns true when token exists and auth_user has setup_required false and two_factor_enabled true', () => {
    setAuthToken('jwt-token');
    setAuthUser({
      id: '1',
      email: 'user@example.com',
      setup_required: false,
      two_factor_enabled: true,
      role: { name: 'Admin' }
    });

    expect(validateAuthSession()).toBe(true);
  });

  it('returns false when two_factor_enabled is false', () => {
    setAuthToken('jwt-token');
    setAuthUser({
      id: '1',
      email: 'user@example.com',
      setup_required: false,
      two_factor_enabled: false,
      role: { name: 'Admin' }
    });

    expect(validateAuthSession()).toBe(false);
  });

  it('returns false when setup_required is true', () => {
    setAuthToken('jwt-token');
    setAuthUser({
      id: '1',
      email: 'user@example.com',
      setup_required: true,
      two_factor_enabled: true
    });

    expect(validateAuthSession()).toBe(false);
  });
});
