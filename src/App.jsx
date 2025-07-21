import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext'; // Add this import
import MainDashboard from './components/MainDashboard';
import Register from './components/Register';
import Login from './components/Login';
import EmailVerification from './components/EmailVerification';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import NotFound from './components/NotFound';

const App = () => {
  return (
    <Router>
      <SocketProvider> {/* Wrap your app with SocketProvider */}
        <div className="App">
          <Routes>
            {/* Default route - redirect to dashboard */}
            <Route 
              path="/" 
              element={<Navigate to="/dashboard" replace />} 
            />

            {/* Public routes (redirect to dashboard if already authenticated) */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />

            {/* Email verification route (accessible to non-authenticated users) */}
            <Route 
              path="/verify-email" 
              element={<EmailVerification />} 
            />

            {/* Protected routes (require authentication) */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <MainDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <MainDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <MainDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/explore" 
              element={
                <ProtectedRoute>
                  <MainDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <MainDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </SocketProvider>
    </Router>
  );
};

export default App;