import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';

import { clearAuthSession, getAuthUserRole, hasAnyRole, hasAuthToken, isAuthUserSetupRequired, isAuthUserTwoFactorEnabled, validateAuthSession } from 'utils/auth';

export default function RoleProtectedRoute({ allowedRoles, children }) {
  const location = useLocation();

  if (!hasAuthToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isAuthUserSetupRequired()) {
    clearAuthSession();
    return <Navigate to="/login" replace state={{ from: location, setupRequired: true }} />;
  }

  if (!isAuthUserTwoFactorEnabled()) {
    clearAuthSession();
    return <Navigate to="/login" replace state={{ from: location, twoFactorRequired: true }} />;
  }

  if (!validateAuthSession()) {
    clearAuthSession();
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const role = getAuthUserRole();

  if (!role) {
    clearAuthSession();
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasAnyRole(allowedRoles)) {
    return <Navigate to="/forbidden" replace state={{ from: location }} />;
  }

  return children;
}

RoleProtectedRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
  children: PropTypes.node.isRequired
};
