import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

// project imports
import App from 'App';
import reportWebVitals from 'reportWebVitals';
import { ConfigProvider } from 'contexts/ConfigContext';

// style + assets
import 'assets/scss/style.scss';

// google-fonts
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/700.css';

import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';

// ==============================|| REACT DOM RENDER ||============================== //

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <ConfigProvider>
    <App />
  </ConfigProvider>
);

if (typeof window !== 'undefined') {
  try {
    registerSW({
      immediate: true,
      onOfflineReady() {
        console.info('[PWA] Offline shell ready (precache populated)');
      },
      onRegistered(registration) {
        if (registration) {
          console.info('[PWA] Service worker registered');
        }
      },
      onRegisterError(error) {
        console.warn('[PWA] Service worker registration failed', error);
      }
    });
  } catch (e) {
    console.warn('[PWA] registerSW could not run:', e);
  }

  try {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      console.info('[PWA] Network status:', navigator.onLine ? 'online' : 'offline');
    }
    window.addEventListener('online', () => console.info('[PWA] Browser reports online'));
    window.addEventListener('offline', () => console.info('[PWA] Browser reports offline'));
  } catch (e) {
    console.warn('[PWA] Network status listeners failed:', e);
  }
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
