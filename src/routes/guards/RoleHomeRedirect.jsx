import { Navigate } from 'react-router-dom';

import { clearAuthSession, getAuthUserRole, getDefaultRouteForRole, hasAuthToken, validateAuthSession } from 'utils/auth';

export default function RoleHomeRedirect() {
  if (!hasAuthToken()) {
    return <Navigate to="/login" replace />;
  }

  if (!validateAuthSession()) {
    clearAuthSession();
    return <Navigate to="/login" replace />;
  }

  const role = getAuthUserRole();
  return <Navigate to={getDefaultRouteForRole(role)} replace />;
}
