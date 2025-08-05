import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@relaycore/design-system';
import { lightTheme } from '@relaycore/design-system';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { RequestLogs } from './pages/RequestLogs';
import { Configuration } from './pages/Configuration';
import { Analytics } from './pages/Analytics';
import { Users } from './pages/Users';
import SteeringRules from './pages/SteeringRules';
import { Login, Register, ForgotPassword, ResetPassword } from './pages/Auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={lightTheme}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/requests" element={
              <ProtectedRoute>
                <Layout>
                  <RequestLogs />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Layout>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/config" element={
              <ProtectedRoute>
                <Layout>
                  <Configuration />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <div>Admin Dashboard</div>
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Steering Rules */}
            <Route path="/steering" element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <SteeringRules />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;