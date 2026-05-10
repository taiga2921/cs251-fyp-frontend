import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

// project imports
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';
import ProtectedRoute from './guards/ProtectedRoute';

// dashboard routing
const DashboardDefault = Loadable(lazy(() => import('views/dashboard/Default')));

// guard routing
const GuardPatrol = Loadable(lazy(() => import('../feature/patrol/views/PartrolHome')));

// operator routing
const OperatorPatrolLiveTracking = Loadable(lazy(() => import('../feature/patrol-live-tracking/views/PatrolLiveList')));
const OperatorPatrolHistory = Loadable(lazy(() => import('../feature/patrol-history/views/PatrolHistoryList')));
const OperatorPatrolHistoryView = Loadable(lazy(() => import('../feature/patrol-history/views/PatrolHistoryView')));

// admin routing
const AdminUserManagement = Loadable(lazy(() => import('../feature/management-user/views/UserList')));
const AdminUserManagementView = Loadable(lazy(() => import('../feature/management-user/views/UserView')));
const AdminUserManagementAdd = Loadable(lazy(() => import('../feature/management-user/views/UserAdd')));
const AdminUserManagementEdit = Loadable(lazy(() => import('../feature/management-user/views/UserEdit')));

const AdminZoneManagement = Loadable(lazy(() => import('../feature/management-zone/views/ZoneList')));
const AdminZoneManagementAdd = Loadable(lazy(() => import('../feature/management-zone/views/ZoneAdd')));
const AdminZoneManagementEdit = Loadable(lazy(() => import('../feature/management-zone/views/ZoneEdit')));

const AdminCheckpointManagement = Loadable(lazy(() => import('../feature/management-checkpoint/views/CheckpointList')));
const AdminCheckpointManagementView = Loadable(lazy(() => import('../feature/management-checkpoint/views/CheckpointView')));
const AdminCheckpointManagementAdd = Loadable(lazy(() => import('../feature/management-checkpoint/views/CheckpointAdd')));
const AdminCheckpointManagementEdit = Loadable(lazy(() => import('../feature/management-checkpoint/views/CheckpointEdit')));

// const AdminBlockchain = Loadable(lazy(() => import('../feature/blockchain/views/GateLiveList')));

// utilities routing
const UtilsTypography = Loadable(lazy(() => import('views/utilities/Typography')));
const UtilsColor = Loadable(lazy(() => import('views/utilities/Color')));
const UtilsShadow = Loadable(lazy(() => import('views/utilities/Shadow')));

// sample page routing
const SamplePage = Loadable(lazy(() => import('views/sample-page')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: (
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      index: true,
      element: <Navigate to="/dashboard" replace />
    },
    {
      path: 'dashboard',
      element: <DashboardDefault />
    },
    {
      path: 'dashboard/default',
      element: <DashboardDefault />
    },

    // ----------------- GUARD ROUTES ----------------- //

    // Patrol
    {
      path: 'guard/patrol',
      element: <GuardPatrol />
    },

    // ----------------- OPERATOR ROUTES ----------------- //

    // Patrol
    {
       path: 'operator/patrol/live-tracking',
       element: <OperatorPatrolLiveTracking />
    },
    {
      path: 'operator/patrol/history',
      element: <OperatorPatrolHistory />
    },
    {
      path: 'operator/patrol/history/view/:patrolHistoryId',
      element: <OperatorPatrolHistoryView />
    },

    // // Gate ANPR
    // {
    //    path: 'operator/gate/anprLive',
    //    element: <OperatorGateLive />
    // },
    // {
    //    path: 'operator/gate/history',
    //    element: <OperatorGateHistory />
    // },

    // =================== ADMIN ROUTES =================== //

    // Admin Routes - User Management
    {
      path: 'admin/management-user',
      element: <AdminUserManagement />
    },
    {
      path: 'admin/management-user/view/:userId',
      element: <AdminUserManagementView />
    },
    {
      path: 'admin/management-user/add',
      element: <AdminUserManagementAdd />
    },
    {
      path: 'admin/management-user/edit/:userId',
      element: <AdminUserManagementEdit />
    },

    // Admin Routes - Zone Management
    {
      path: 'admin/management-zone',
      element: <AdminZoneManagement />
    },
    {
      path: 'admin/management-zone/add',
      element: <AdminZoneManagementAdd />
    },
    {
      path: 'admin/management-zone/edit/:zoneId',
      element: <AdminZoneManagementEdit />
    },

    // Admin Routes - Checkpoint Management
    {
      path: 'admin/management-zone/view/:zoneId',
      element: <AdminCheckpointManagement />
    },
    {
      path: 'admin/management-checkpoint/view/:checkpointId',
      element: <AdminCheckpointManagementView />
    },
    {
      path: 'admin/management-checkpoint/add/:zoneId',
      element: <AdminCheckpointManagementAdd />
    },
    {
      path: 'admin/management-checkpoint/edit/:zoneId/:checkpointId',
      element: <AdminCheckpointManagementEdit />
    },

    {
      path: 'typography',
      element: <UtilsTypography />
    },
    {
      path: 'color',
      element: <UtilsColor />
    },
    {
      path: 'shadow',
      element: <UtilsShadow />
    },
    {
      path: '/sample-page',
      element: <SamplePage />
    }
  ]
};

export default MainRoutes;
