import { Component, memo, useEffect } from 'react';

import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

import GetAppOutlinedIcon from '@mui/icons-material/GetAppOutlined';

// ==============================|| SIDEBAR - PWA INSTALL (ERROR BOUNDARY) ||============================== //

class PwaInstallErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn('[PWA] SidebarPwaInstall failed; hiding install UI.', error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

function SidebarPwaInstallInner({ downMD, drawerOpen, showInstallButton, isInstalled, isStandalone, hasDeferredPrompt, promptInstall }) {
  useEffect(() => {
    if (!downMD) return;
    console.info('[PWA][mobile sidebar]', {
      downMD,
      drawerOpen,
      showInstallButton,
      isInstalled,
      canInstall: hasDeferredPrompt,
      isStandalone
    });
  }, [downMD, drawerOpen, showInstallButton, isInstalled, hasDeferredPrompt, isStandalone]);

  if (!showInstallButton) {
    return null;
  }

  return (
    <Box sx={{ pb: 2, pt: 1, flexShrink: 0 }}>
      <Button
        fullWidth
        variant="outlined"
        color="primary"
        size="small"
        startIcon={<GetAppOutlinedIcon />}
        onClick={() => {
          void promptInstall();
        }}
      >
        Install App
      </Button>
    </Box>
  );
}

/** Install UI only; parent must call usePwaInstallPrompt so listeners run even when drawer is closed. */
function SidebarPwaInstall(props) {
  return (
    <PwaInstallErrorBoundary>
      <SidebarPwaInstallInner {...props} />
    </PwaInstallErrorBoundary>
  );
}

export default memo(SidebarPwaInstall);
