import PropTypes from 'prop-types';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { clearAuthSession, hasAuthToken, validateAuthSession } from 'utils/auth';

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!hasAuthToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!validateAuthSession()) {
    clearAuthSession();
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children || <Outlet />;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node
};
