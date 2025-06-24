import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import IncomeTypes from './pages/IncomeTypes';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Layout from './components/Layout';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route 
            path="/auth" 
            element={
              !isAuthenticated ? (
                <AuthPage onLogin={handleLogin} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? (
                <Layout onLogout={handleLogout}>
                  <Dashboard />
                </Layout>
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />
          <Route 
            path="/income-types" 
            element={
              isAuthenticated ? (
                <Layout onLogout={handleLogout}>
                  <IncomeTypes />
                </Layout>
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />
          <Route 
            path="/income" 
            element={
              isAuthenticated ? (
                <Layout onLogout={handleLogout}>
                  <Income />
                </Layout>
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />
          <Route 
            path="/expenses" 
            element={
              isAuthenticated ? (
                <Layout onLogout={handleLogout}>
                  <Expenses />
                </Layout>
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />
          <Route path="/" element={<Navigate to="/auth" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;