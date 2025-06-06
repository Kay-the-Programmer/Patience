
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { SnackbarProvider } from './contexts/SnackbarContext'; // Import SnackbarProvider
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import RegisterFilePage from './pages/RegisterFilePage';
import OfficeManagementPage from './pages/Admin/OfficeManagementPage';
import FileDetailsPage from './pages/FileDetailsPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { APP_TITLE } from './constants';
import AuditLogPage from './pages/Admin/AuditLogPage';
import ReportingPage from './pages/Admin/ReportingPage';
import WorkflowManagementPage from './pages/Admin/WorkflowManagementPage';
import UserManagementPage from './pages/Admin/UserManagementPage'; // Import UserManagementPage
import { UserRole } from './types';

const App: React.FC = () => {
  document.title = APP_TITLE;
  return (
    <AuthProvider>
      <SnackbarProvider> {/* Wrap DataProvider with SnackbarProvider */}
        <DataProvider>
          <HashRouter>
            <Layout>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/register-file" element={<ProtectedRoute><RegisterFilePage /></ProtectedRoute>} />
                <Route path="/file/:fileId" element={<ProtectedRoute><FileDetailsPage /></ProtectedRoute>} />
                <Route 
                  path="/admin/offices" 
                  element={<ProtectedRoute roles={[UserRole.ADMIN]}><OfficeManagementPage /></ProtectedRoute>} 
                />
                <Route 
                  path="/admin/audit-log" 
                  element={<ProtectedRoute roles={[UserRole.ADMIN]}><AuditLogPage /></ProtectedRoute>} 
                />
                <Route 
                  path="/admin/reports" 
                  element={<ProtectedRoute roles={[UserRole.ADMIN]}><ReportingPage /></ProtectedRoute>} 
                />
                <Route 
                  path="/admin/workflows" 
                  element={<ProtectedRoute roles={[UserRole.ADMIN]}><WorkflowManagementPage /></ProtectedRoute>} 
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute roles={[UserRole.ADMIN]}>
                      <UserManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </HashRouter>
        </DataProvider>
      </SnackbarProvider>
    </AuthProvider>
  );
};

export default App;