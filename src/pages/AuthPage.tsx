import React, { useState } from 'react';
import apiService, { LoginRequest, RegisterRequest, ApiError } from '../services/ApiService';

interface AuthPageProps {
  onLogin: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const [loginForm, setLoginForm] = useState<LoginRequest>({
    username: '',
    password: ''
  });
  
  const [registerForm, setRegisterForm] = useState<RegisterRequest>({
    username: '',
    email: '',
    document: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.login(loginForm);
      
      if (response.success) {
        console.log('Login realizado com sucesso:', response.user);
        onLogin();
      } else {
        setError(response.message || 'Erro no login');
      }
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.message || 'Erro de conexão');
      console.error('Erro no login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.register(registerForm);
      
      if (response.success) {
        console.log('Cadastro realizado com sucesso:', response.user);
        onLogin();
      } else {
        setError(response.message || 'Erro no cadastro');
      }
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.message || 'Erro de conexão');
      console.error('Erro no cadastro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Controle de Gastos</h1>
            <p className="text-gray-600">Gerencie suas finanças pessoais</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex justify-between items-center">
                <p className="text-red-600 text-sm">{error}</p>
                <button
                  onClick={clearError}
                  className="text-red-400 hover:text-red-600 ml-2"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'login'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => {
                setActiveTab('login');
                clearError();
              }}
            >
              Login
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'register'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => {
                setActiveTab('register');
                clearError();
              }}
            >
              Cadastro
            </button>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Usuário
                </label>
                <input
                  type="text"
                  id="username"
                  className="input"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  id="password"
                  className="input"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary w-full h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="reg-username" className="block text-sm font-medium text-gray-700 mb-1">
                  Usuário
                </label>
                <input
                  type="text"
                  id="reg-username"
                  className="input"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="input"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>
              <div>
                <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-1">
                  Documento
                </label>
                <input
                  type="text"
                  id="document"
                  className="input"
                  value={registerForm.document}
                  onChange={(e) => setRegisterForm({ ...registerForm, document: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>
              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  id="reg-password"
                  className="input"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary w-full h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Criando Conta...' : 'Criar Conta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;