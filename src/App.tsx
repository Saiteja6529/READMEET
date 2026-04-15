/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { RecordingPage } from './pages/RecordingPage';
import { ProfilePage } from './pages/ProfilePage';
import { History } from './pages/History';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { MeetingDetails } from './pages/MeetingDetails';
import { SettingsPage } from './pages/SettingsPage';
import { TranscribePage } from './pages/TranscribePage';
import { TasksPage } from './pages/TasksPage';
import { PasteAnalysisPage } from './pages/PasteAnalysisPage';
import { LoginPage } from './pages/LoginPage';
import { LoadingProvider } from './hooks/useLoading';
import { ToastProvider } from './hooks/useToast';
import { AuthProvider } from './components/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

/**
 * EXPO BYPASS: Automatically allows access to the dashboard.
 * Use this during the presentation if the Google OAuth handshake is delayed.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Hardcoding true for the Expo Demo
  const isAuthenticated = true; 
  const loading = false;
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-corporate-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
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
              <Routes>
                {/* Public Route: Login */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* Protected App Routes */}
                <Route 
                  path="/*" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Routes>
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
                          <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </Router>
          </ErrorBoundary>
        </AuthProvider>
      </LoadingProvider>
    </ToastProvider>
  );
}

export default App;