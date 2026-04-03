import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { getUpcomingAssignments } from './lib/db';
import NavigationTracker from './lib/NavigationTracker';
import StudyUsageTracker from './lib/StudyUsageTracker';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { NotificationProvider } from '@/lib/NotificationContext';


const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>;
  }

  if (!isAuthenticated) {
    // FIXED: Use relative path for router-ready navigation on child domains (gh-pages)
    return <Navigate to="/Login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  // Public routes that don't need auth
  const publicRoutes = ['Login', 'Signup', 'Welcome', 'HowItWorks'];

  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        </ProtectedRoute>
      } />
      {Object.entries(Pages).map(([path, Page]) => {
        const isPublic = publicRoutes.includes(path);

        // Hide Layout for purely auth screens
        const noLayout = path === 'Login' || path === 'Signup';

        const Element = noLayout ? <Page /> : (
          <LayoutWrapper currentPageName={path}>
            <Page />
          </LayoutWrapper>
        );

        return (
          <Route
            key={path}
            path={`/${path}`}
            element={isPublic ? Element : <ProtectedRoute>{Element}</ProtectedRoute>}
          />
        );
      })}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  // Notification checking is now handled by NotificationContext
  // No need for manual checking here anymore

  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <NotificationProvider>
          <Router basename={import.meta.env.BASE_URL} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <NavigationTracker />
            <StudyUsageTracker />
            <AppRoutes />
          </Router>

          <Toaster />
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
