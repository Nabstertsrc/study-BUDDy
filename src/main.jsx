import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

import ErrorBoundary from '@/components/common/ErrorBoundary.jsx'

import EULAGuard from '@/components/common/EULAGuard.jsx'

import { App as CapApp } from '@capacitor/app';

// Handle Android Back Button
CapApp.addListener('backButton', ({ canGoBack }) => {
  if (!canGoBack) {
    CapApp.exitApp();
  } else {
    window.history.back();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <EULAGuard>
      <App />
    </EULAGuard>
  </ErrorBoundary>
)
