import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoadingProvider } from './contexts/LoadingContext';
import { ToastProvider } from './hooks/useToast';
import { AuthProvider, useAuth } from './components/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Route-level code splitting for performance optimization
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const RecordingPage = lazy(() => import('./pages/RecordingPage').then(m => ({ default: m.RecordingPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const History = lazy(() => import('./pages/History').then(m => ({ default: m.History })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const MeetingDetails = lazy(() => import('./pages/MeetingDetails').then(m => ({ default: m.MeetingDetails })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const TranscribePage = lazy(() => import('./pages/TranscribePage').then(m => ({ default: m.TranscribePage })));
const TasksPage = lazy(() => import('./pages/TasksPage').then(m => ({ default: m.TasksPage })));
const PasteAnalysisPage = lazy(() => import('./pages/PasteAnalysisPage').then(m => ({ default: m.PasteAnalysisPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
      <h1 className="text-6xl font-extrabold text-blue-600">404</h1>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Page Not Found</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm">
        The page you are looking for might have been removed or is temporarily unavailable.
      </p>
      <a href="/dashboard" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-md shadow-blue-600/10 hover:shadow-lg">
        Back to Dashboard
      </a>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <ToastProvider>
      <LoadingProvider>
        <AuthProvider>
          <ErrorBoundary>
            <Router>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  {/* Public Route: Login */}
                  <Route path="/login" element={<LoginPage />} />

                  {/* Protected App Routes — Layout Wrapper */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Suspense fallback={<LoadingSpinner />}>
                            <Outlet />
                          </Suspense>
                        </Layout>
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/record" element={<RecordingPage />} />
                    <Route path="/transcribe" element={<TranscribePage />} />
                    <Route path="/paste-analysis" element={<PasteAnalysisPage />} />
                    <Route path="/meeting/:id" element={<MeetingDetails />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/tasks" element={<TasksPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Suspense>
            </Router>
          </ErrorBoundary>
        </AuthProvider>
      </LoadingProvider>
    </ToastProvider>
  );
}

export default App;