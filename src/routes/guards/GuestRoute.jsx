import PropTypes from 'prop-types';
import { Navigate, Outlet } from 'react-router-dom';

import { clearAuthSession, getAuthUserRole, getDefaultRouteForRole, hasAuthToken, isAuthUserSetupRequired, validateAuthSession } from 'utils/auth';

export default function GuestRoute({ children }) {
  if (hasAuthToken()) {
    if (isAuthUserSetupRequired()) {
      clearAuthSession();
    } else if (validateAuthSession()) {
      return <Navigate to={getDefaultRouteForRole(getAuthUserRole())} replace />;
    }
  }

  return children || <Outlet />;
}

GuestRoute.propTypes = {
  children: PropTypes.node
};
