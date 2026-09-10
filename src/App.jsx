import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import NavigationTracker from './lib/NavigationTracker';
import StudyUsageTracker from './lib/StudyUsageTracker';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import AiAdGateProvider from '@/components/ads/AiAdGateProvider';
import { NotificationProvider } from '@/lib/NotificationContext';
import EULAGuard from '@/components/common/EULAGuard';
import { isNativeShell } from '@/lib/platform';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;
const LandingPage = Pages.Landing;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/Login" replace />;
  }

  return children;
};

/** Product surfaces require EULA acceptance (not the public marketing pages). */
const ProductGate = ({ children }) => (
  <EULAGuard>{children}</EULAGuard>
);

const WebRoot = ({ fallback, dashboardElement }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return fallback;
  // Returning visitors who are already signed in go to the app, not the marketing page.
  if (isAuthenticated) return dashboardElement;
  return (
    <Suspense fallback={fallback}>
      <LandingPage />
    </Suspense>
  );
};

const AppRoutes = () => {
  // Public marketing / legal / auth entry — Landing & EULA skip the EULA wall
  const publicRoutes = ['Login', 'Signup', 'Welcome', 'HowItWorks', 'Landing', 'EULA'];
  // Auth screens + anything that enters the product should accept EULA first
  const eulaBeforeEntry = ['Login', 'Signup', 'Welcome'];

  const fallback = (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
    </div>
  );

  const dashboardElement = (
    <ProductGate>
      <ProtectedRoute>
        <LayoutWrapper currentPageName={mainPageKey}>
          <Suspense fallback={fallback}>
            <MainPage />
          </Suspense>
        </LayoutWrapper>
      </ProtectedRoute>
    </ProductGate>
  );

  // Web cold traffic: marketing landing first.
  // Electron / Capacitor: skip marketing, go straight into product (still EULA-gated).
  const rootElement = isNativeShell()
    ? dashboardElement
    : <WebRoot fallback={fallback} dashboardElement={dashboardElement} />;

  return (
    <Routes>
      <Route path="/" element={rootElement} />
      {Object.entries(Pages).map(([path, Page]) => {
        const isPublic = publicRoutes.includes(path);
        const noLayout = path === 'Login' || path === 'Signup' || path === 'Landing' || path === 'EULA';
        const needsEula = eulaBeforeEntry.includes(path) || !isPublic;

        const pageNode = (
          <Suspense fallback={fallback}><Page /></Suspense>
        );

        const withLayout = noLayout ? pageNode : (
          <LayoutWrapper currentPageName={path}>{pageNode}</LayoutWrapper>
        );

        const withEula = needsEula ? <ProductGate>{withLayout}</ProductGate> : withLayout;

        const element = isPublic
          ? withEula
          : <ProtectedRoute>{withEula}</ProtectedRoute>;

        return (
          <Route
            key={path}
            path={`/${path}`}
            element={element}
          />
        );
      })}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
      <AiAdGateProvider>
        <NotificationProvider>
          <Router basename={import.meta.env.BASE_URL} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <NavigationTracker />
            <StudyUsageTracker />
            <AppRoutes />
          </Router>

          <Toaster />
        </NotificationProvider>
      </AiAdGateProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
