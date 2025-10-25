import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import WorkflowStudioApp from './components/WorkflowStudioApp'
import './WorkflowStudioStyles.css'
import './index.css'

// Set document language for accessibility
document.documentElement.lang = 'en-US';

// Initialize Chrome DevTools integration
async function initializeDevTools() {
  // Only initialize in development/staging environments
  const isDevToolsEnabled = import.meta.env.DEV ||
    import.meta.env.VITE_DEVTOOLS_ENABLED === 'true' ||
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'staging';

  if (isDevToolsEnabled) {
    try {
      const { ChromeDevToolsBridge } = await import('./utils/chrome-devtools-bridge.js');
      const { devToolsConfig } = await import('./utils/devtools-config.js');

      const bridge = new ChromeDevToolsBridge({
        environment: (import.meta.env.PROD ? 'production' : 'development') as 'development' | 'staging' | 'production',
      });

      await bridge.init();

      // Make DevTools API globally available
      (window as any).devtools = bridge;

      console.log('[App] Chrome DevTools integration initialized');
    } catch (error) {
      console.error('[App] Failed to initialize DevTools:', error);
    }
  }
}

// Initialize DevTools
initializeDevTools();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <WorkflowStudioApp />
    </BrowserRouter>
  </React.StrictMode>,
)
