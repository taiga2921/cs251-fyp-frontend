import PropTypes from 'prop-types';
import { Navigate, Outlet } from 'react-router-dom';

import { hasAuthToken } from 'utils/auth';

export default function GuestRoute({ children }) {
  if (hasAuthToken()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children || <Outlet />;
}

GuestRoute.propTypes = {
  children: PropTypes.node
};
