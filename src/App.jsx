import { RouterProvider } from 'react-router-dom';

// routing
import router from 'routes';

// project imports
import NetworkSnackbar from 'components/NetworkSnackbar';
import NavigationScroll from 'layout/NavigationScroll';
import SessionExpiredDialog from 'feature/authentication/components/SessionExpiredDialog';

import ThemeCustomization from 'themes';

// auth provider

// ==============================|| APP ||============================== //

export default function App() {
  return (
    <ThemeCustomization>
      <NavigationScroll>
        <>
          <NetworkSnackbar />
          <SessionExpiredDialog />
          <RouterProvider router={router} />
        </>
      </NavigationScroll>
    </ThemeCustomization>
  );
}
