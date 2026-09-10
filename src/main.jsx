import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

import ErrorBoundary from '@/components/common/ErrorBoundary.jsx'

import { App as CapApp } from '@capacitor/app';

// Handle Android Back Button
CapApp.addListener('backButton', ({ canGoBack }) => {
  if (!canGoBack) {
    CapApp.exitApp();
  } else {
    window.history.back();
  }
});

// EULA is no longer a cold-traffic first paint.
// It is required at product entry (Login/Signup/protected app) via EULAGuard in App.jsx.
ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
