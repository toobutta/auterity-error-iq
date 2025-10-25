import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorProvider } from "./contexts/ErrorContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider } from "./components/ThemeProvider";
import { NotificationProvider } from "./components/notifications/NotificationSystem";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
// Lazy load heavy components
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ModernDashboard = lazy(() => import("./pages/ModernDashboard"));
const Workflows = lazy(() => import("./pages/Workflows"));
const Templates = lazy(() => import("./pages/Templates"));
const WorkflowBuilderPage = lazy(() => import("./pages/WorkflowBuilderPage"));
const ErrorDisplayDemo = lazy(() => import("./pages/ErrorDisplayDemo"));
const KiroTestPage = lazy(() => import("./pages/KiroTestPage"));
const AgentModelCorrelationPage = lazy(
  () => import("./pages/AgentModelCorrelationPage"),
);
const AuterityExpansion = lazy(() => import("./pages/AuterityExpansion"));
const CognitiveAutomationPage = lazy(() => import("./pages/CognitiveAutomationPage"));
const EnterpriseDashboard = lazy(
  () => import("./components/enterprise/EnterpriseDashboard"),
);

// Loading component for lazy-loaded routes
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">Loading...</span>
  </div>
);

function App() {
  return (
    <ErrorBoundary
      showDetails={process.env.NODE_ENV === "development"}
      enableReporting={true}
      component="App"
    >
      <ThemeProvider defaultMode="auto" storageKey="autmatrix-theme">
        <NotificationProvider position="top-right" maxNotifications={5}>
          <ErrorProvider
            maxErrors={10}
            enableErrorReporting={true}
            toastPosition="top-right"
          >
            <AuthProvider>
              <Router>
                <div className="App">
                  <Routes>
                    {/* Public routes */}
                    <Route
                      path="/login"
                      element={
                        <ErrorBoundary component="LoginForm">
                          <LoginForm />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/register"
                      element={
                        <ErrorBoundary component="RegisterForm">
                          <RegisterForm />
                        </ErrorBoundary>
                      }
                    />

                    {/* Protected routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary component="ModernDashboard">
                            <Suspense fallback={<LoadingSpinner />}>
                              <ModernDashboard />
                            </Suspense>
                          </ErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/legacy"
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary component="Dashboard">
                            <Suspense fallback={<LoadingSpinner />}>
                              <Dashboard />
                            </Suspense>
                          </ErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/workflows"
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary component="Workflows">
                            <Suspense fallback={<LoadingSpinner />}>
                              <Workflows />
                            </Suspense>
                          </ErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/templates"
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary component="Templates">
                            <Suspense fallback={<LoadingSpinner />}>
                              <Templates />
                            </Suspense>
                          </ErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/enterprise"
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary component="EnterpriseDashboard">
                            <Suspense fallback={<LoadingSpinner />}>
                              <EnterpriseDashboard />
                            </Suspense>
                          </ErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/workflows/builder"
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary component="WorkflowBuilder">
                            <Suspense fallback={<LoadingSpinner />}>
                              <WorkflowBuilderPage />
                            </Suspense>
                          </ErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/workflows/builder/:id"
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary component="WorkflowBuilder">
                            <Suspense fallback={<LoadingSpinner />}>
                              <WorkflowBuilderPage />
                            </Suspense>
                          </ErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/error-demo"
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary component="ErrorDisplayDemo">
                            <Suspense fallback={<LoadingSpinner />}>
                              <ErrorDisplayDemo />
                            </Suspense>
                          </ErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/agent-correlation"
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary component="AgentModelCorrelation">
                            <Suspense fallback={<LoadingSpinner />}>
                              <AgentModelCorrelationPage />
                            </Suspense>
                          </ErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/kiro-test"
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary component="KiroTestPage">
                            <Suspense fallback={<LoadingSpinner />}>
                              <KiroTestPage />
                            </Suspense>
                          </ErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/auterity-expansion"
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary component="AuterityExpansion">
                            <Suspense fallback={<LoadingSpinner />}>
                              <AuterityExpansion />
                            </Suspense>
                          </ErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/cognitive-automation"
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary component="CognitiveAutomation">
                            <Suspense fallback={<LoadingSpinner />}>
                              <CognitiveAutomationPage />
                            </Suspense>
                          </ErrorBoundary>
                        </ProtectedRoute>
                      }
                    />

                    {/* Default redirect */}
                    <Route
                      path="/"
                      element={<Navigate to="/dashboard" replace />}
                    />
                  </Routes>
                </div>
              </Router>
            </AuthProvider>
          </ErrorProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;


