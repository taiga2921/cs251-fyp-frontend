import { getAuthUserRole, ROLES } from 'utils/auth';

import dashboard from './dashboard';
import guard from './guard';
import admin from './admin';

const securityOperatorPatrolMonitoring = {
  id: 'security-operator',
  title: 'Monitoring',
  type: 'group',
  children: [
    {
      id: 'security-operator-patrol-monitoring',
      title: 'Patrol Monitoring',
      type: 'item',
      url: '/admin/patrol-monitoring'
    }
  ]
};

/**
 * @param {string | null} [role] — defaults to current user role from localStorage
 */
export function getMenuItemsForRole(role = getAuthUserRole()) {
  switch (role) {
    case ROLES.GUARD:
      return { items: [guard] };
    case ROLES.SECURITY_OPERATOR:
      return { items: [securityOperatorPatrolMonitoring] };
    case ROLES.ADMIN:
      return { items: [dashboard, admin] };
    default:
      return { items: [] };
  }
}

export default getMenuItemsForRole;
