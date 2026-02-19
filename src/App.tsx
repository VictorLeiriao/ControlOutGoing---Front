import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import IncomeTypes from './pages/IncomeTypes';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import ExpenseCategories from './pages/ExpenseCategories';
import Debited from './pages/Debited'; 
import Layout from './components/Layout';
import InvestmentTypes from './pages/InvestmentTypes'; 

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
          {/* Rota de Autenticação */}
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

          {/* Rota Dashboard */}
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

          {/* Rota Tipos de Renda */}
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

          {/* Rota Rendas */}
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

          {/* Rota Gastos */}
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

          {/* Rota Categorias de Gastos */}
          <Route 
            path="/expense-categories" 
            element={
              isAuthenticated ? (
                <Layout onLogout={handleLogout}>
                  <ExpenseCategories />
                </Layout>
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />

          {/* Rota Debitado */}
          <Route 
            path="/debited" 
            element={
              isAuthenticated ? (
                <Layout onLogout={handleLogout}>
                  <Debited />
                </Layout>
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />

          {/* Nova Rota para Tipos de Investimento (Protegida) */}
          <Route 
            path="/investment-types" 
            element={
              isAuthenticated ? (
                <Layout onLogout={handleLogout}>
                  <InvestmentTypes />
                </Layout>
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />

          {/* Redirecionamentos de Fallback */}
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/auth"} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;