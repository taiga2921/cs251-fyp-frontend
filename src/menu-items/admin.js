// assets
import { IconChartDots3, IconSettings } from '@tabler/icons-react';

// constant
const icons = {
  IconChartDots3,
  IconSettings
};

// ==============================|| MENU ITEMS - ADMIN ||============================== //

const admin = {
  id: 'admin',
  title: 'Admin',
  // caption: 'Admin Caption',
  // icon: icons.IconKey,
  type: 'group',
  children: [
    // {
    //    id: 'admin-blockchain',
    //    title: 'Blockchain Verifier',
    //    type: 'collapse',
    //    icon: icons.IconChartDots3,
    //    children: [
    //       {
    //          id: 'admin-event-hashes',
    //          title: 'Event Hashes',
    //          type: 'item',
    //          url: '/admin/blockchain/event-hashes'
    //       },
    //       {
    //          id: 'admin-smart-contract-logs',
    //          title: 'Smart Contract Logs',
    //          type: 'item',
    //          url: '/admin/blockchain/smart-contract-logs'
    //       }
    //    ]
    // },
    {
      id: 'admin-management',
      title: 'Management',
      type: 'collapse',
      icon: icons.IconSettings,
      children: [
        {
          id: 'admin-user-management',
          title: 'User',
          type: 'item',
          url: '/admin/management-user'
        },
        {
          id: 'admin-zone-management',
          title: 'Zone',
          type: 'item',
          url: '/admin/management-zone'
        },
        // {
        //   id: 'admin-checkpoint-management',
        //   title: 'Checkpoint',
        //   type: 'item',
        //   url: '/admin/management-checkpoint'
        // },
        // {
        //   id: 'admin-camera-management',
        //   title: 'Camera',
        //   type: 'item',
        //   url: '/admin/management-camera'
        // },
        {
          id: 'admin-vehicle-management',
          title: 'Vehicle',
          type: 'item',
          url: '/admin/management-vehicle'
        }
      ]
    }
  ]
};

export default admin;
