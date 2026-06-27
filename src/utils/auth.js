export const AUTH_TOKEN_KEY = 'access_token';
export const AUTH_USER_KEY = 'auth_user';
export const SESSION_EXPIRED_FLAG_KEY = 'auth_session_expired';
export const AUTH_SESSION_EXPIRED_EVENT = 'auth:session-expired';

export const ROLES = {
  ADMIN: 'Admin',
  SECURITY_OPERATOR: 'Security Operator',
  GUARD: 'Guard'
};

const CANONICAL_ROLES = [ROLES.ADMIN, ROLES.SECURITY_OPERATOR, ROLES.GUARD];

/** All authenticated app roles — used for shared routes such as Patrol Home. */
export const ALL_ROLES = [...CANONICAL_ROLES];

/** In-memory access token cache (M2 migration step; localStorage remains for route-guard reload support). */
let memoryAuthToken = null;

export function getAuthToken() {
  if (memoryAuthToken) {
    return memoryAuthToken;
  }
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function hasAuthToken() {
  return Boolean(getAuthToken());
}

export function setAuthToken(token) {
  memoryAuthToken = token;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  memoryAuthToken = null;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getAuthUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function setAuthUser(user) {
  if (user == null) {
    localStorage.removeItem(AUTH_USER_KEY);
    return;
  }
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

/**
 * Resolve role name from stored user payload.
 * Supports auth_user.role.name, auth_user.role (string), auth_user.role_name.
 */
export function getAuthUserRole() {
  const user = getAuthUser();
  if (!user) {
    return null;
  }

  if (typeof user.role === 'string') {
    return normalizeRoleName(user.role);
  }

  if (user.role && typeof user.role === 'object' && user.role.name) {
    return normalizeRoleName(user.role.name);
  }

  if (user.role_name) {
    return normalizeRoleName(user.role_name);
  }

  return null;
}

export function normalizeRoleName(role) {
  if (role == null || role === '') {
    return null;
  }

  const trimmed = String(role).trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'admin') return ROLES.ADMIN;
  if (lower === 'guard') return ROLES.GUARD;
  if (lower === 'security operator' || lower === 'security_operator') {
    return ROLES.SECURITY_OPERATOR;
  }

  const match = CANONICAL_ROLES.find((canonical) => canonical.toLowerCase() === lower);
  return match ?? trimmed;
}

export function hasRole(roleName) {
  const current = getAuthUserRole();
  const expected = normalizeRoleName(roleName);
  if (!current || !expected) {
    return false;
  }
  return current === expected;
}

export function hasAnyRole(roleNames) {
  if (!Array.isArray(roleNames) || roleNames.length === 0) {
    return false;
  }
  return roleNames.some((role) => hasRole(role));
}

/**
 * Default landing route after login or when redirecting away from forbidden routes.
 */
export function getDefaultRouteForRole(role) {
  const normalized = normalizeRoleName(role ?? getAuthUserRole());

  switch (normalized) {
    case ROLES.SECURITY_OPERATOR:
      return '/admin/patrol-monitoring';
    case ROLES.GUARD:
      return '/patrol';
    case ROLES.ADMIN:
    default:
      return '/dashboard';
  }
}

/** Token present and auth_user is stored and parseable. */
export function validateAuthSession() {
  if (!hasAuthToken()) {
    return false;
  }

  const user = getAuthUser();
  if (user === null) {
    return false;
  }

  if (user.setup_required === true) {
    return false;
  }

  return true;
}

export function isAuthUserSetupRequired() {
  const user = getAuthUser();
  return Boolean(user?.setup_required);
}

export function clearAuthSession() {
  clearAuthToken();
  localStorage.removeItem(AUTH_USER_KEY);
}

/** Non-sensitive flag so session-expired UX survives redirect to /login. */
export function markSessionExpired() {
  try {
    sessionStorage.setItem(SESSION_EXPIRED_FLAG_KEY, '1');
  } catch {
    /* ignore storage failures in private mode */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT));
  }
}

export function consumeSessionExpiredFlag() {
  try {
    const flag = sessionStorage.getItem(SESSION_EXPIRED_FLAG_KEY);
    if (flag) {
      sessionStorage.removeItem(SESSION_EXPIRED_FLAG_KEY);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function clearSessionExpiredFlag() {
  try {
    sessionStorage.removeItem(SESSION_EXPIRED_FLAG_KEY);
  } catch {
    /* ignore */
  }
}
