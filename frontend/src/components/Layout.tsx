import React from 'react';
import { RealtimeStatusProvider } from './RealtimeStatusProvider';
import { NotificationCenter } from './NotificationCenter';
import { OnboardingOverlay } from './OnboardingOverlay';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { KiroStatusIndicator } from './KiroStatusIndicator';
import { Button } from '../../../shared/components/Button';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <RealtimeStatusProvider>
      <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">
                  AutoMatrix AI Hub
                </h1>
              </Link>
              
              {/* Navigation Links */}
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <Link
                  to="/dashboard"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/workflows"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Workflows
                </Link>
                <Link
                  to="/templates"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Templates
                </Link>
                <Link
                  to="/kiro-test"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Kiro Test
                </Link>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <KiroStatusIndicator />
              <span className="text-sm text-gray-700">
                Welcome, {user?.name}
              </span>
              <Button
                onClick={handleLogout}
                variant="secondary"
                size="sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      <NotificationCenter />
      <OnboardingOverlay />
    </div>
    </RealtimeStatusProvider>
  );
};

export default Layout;