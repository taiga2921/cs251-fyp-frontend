import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

// project imports
import Loadable from 'ui-component/Loadable';
import MinimalLayout from 'layout/MinimalLayout';
import GuestRoute from './guards/GuestRoute';

// maintenance routing
const LoginPage = Loadable(lazy(() => import('views/pages/authentication/Login')));
const RegisterPage = Loadable(lazy(() => import('views/pages/authentication/Register')));
const FirstLoginSetupPage = Loadable(lazy(() => import('feature/authentication/views/FirstLoginSetup')));

// ==============================|| AUTHENTICATION ROUTING ||============================== //

const AuthenticationRoutes = {
  path: '/',
  element: (
    <GuestRoute>
      <MinimalLayout />
    </GuestRoute>
  ),
  children: [
    {
      path: 'login',
      element: <LoginPage />
    },
    {
      path: 'first-login/setup',
      element: <FirstLoginSetupPage />
    },
    {
      path: 'pages/login',
      element: <Navigate to="/login" replace />
    },
    {
      path: 'pages/register',
      element: <RegisterPage />
    }
  ]
};

export default AuthenticationRoutes;
