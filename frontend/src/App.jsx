import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore } from './store/authStore';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { InterviewRoomPage } from './pages/InterviewRoomPage';
import { LiveInterviewPage } from './pages/LiveInterviewPage';
import { ResultsPage } from './pages/ResultsPage';
import { PricingPage } from './pages/PricingPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { TermsAcceptancePage } from './pages/TermsAcceptancePage';
import { DocsPage } from './pages/DocsPage';

function PrivateRoute({ children }) {
  const { token, currentUser, loading } = useAuthStore();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" />;
  }

  // Only block routing while bootstrapping the user from token.
  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If user hasn't accepted terms, redirect to terms acceptance page
  if (currentUser && !currentUser.termsAccepted && location.pathname !== '/accept-terms') {
    return <Navigate to="/accept-terms" />;
  }

  // If terms are already accepted, don't allow going back to terms page
  if (currentUser && currentUser.termsAccepted && location.pathname === '/accept-terms') {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

function App() {
  const { token, currentUser, getMe } = useAuthStore();

  useEffect(() => {
    if (token && !currentUser) {
      getMe().catch(() => {
        // Errors are handled in the auth store/interceptors.
      });
    }
  }, [token, currentUser, getMe]);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/accept-terms"
          element={
            <PrivateRoute>
              <TermsAcceptancePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/interview/:interviewId"
          element={
            <PrivateRoute>
              <InterviewRoomPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/live-interview/:interviewId"
          element={
            <PrivateRoute>
              <LiveInterviewPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/results/:interviewId"
          element={
            <PrivateRoute>
              <ResultsPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  </GoogleOAuthProvider>
  );
}

export default App;
