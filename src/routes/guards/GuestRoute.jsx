import PropTypes from 'prop-types';
import { Navigate, Outlet } from 'react-router-dom';

import { getAuthUserRole, getDefaultRouteForRole, hasAuthToken, validateAuthSession } from 'utils/auth';

export default function GuestRoute({ children }) {
  if (hasAuthToken() && validateAuthSession()) {
    return <Navigate to={getDefaultRouteForRole(getAuthUserRole())} replace />;
  }

  return children || <Outlet />;
}

GuestRoute.propTypes = {
  children: PropTypes.node
};
