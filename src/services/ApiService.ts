export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    username: string;
    email?: string;
  };
  message?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  document: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  status?: number;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://localhost:3001/api') {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('authToken');
  }

  // Método privado para fazer requisições HTTP
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Adiciona token de autorização se disponível
    if (this.token) {
      defaultHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          success: false,
          message: errorData.message || `HTTP Error: ${response.status}`,
          status: response.status,
        } as ApiError;
      }

      return await response.json();
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error) {
        throw error;
      }
      
      throw {
        success: false,
        message: 'Erro de conexão com o servidor',
      } as ApiError;
    }
  }

  // Método para realizar login
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await this.makeRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      // Se o login for bem-sucedido, armazena o token
      if (response.success && response.token) {
        this.setToken(response.token);
      }

      return response;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  // Método para realizar cadastro
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await this.makeRequest<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      // Se o cadastro for bem-sucedido, armazena o token
      if (response.success && response.token) {
        this.setToken(response.token);
      }

      return response;
    } catch (error) {
      console.error('Erro no cadastro:', error);
      throw error;
    }
  }

  // Método para logout
  async logout(): Promise<void> {
    try {
      // Opcional: chamar endpoint de logout no servidor
      await this.makeRequest('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Remove o token independentemente do resultado
      this.removeToken();
    }
  }

  // Método para verificar se o token ainda é válido
  async validateToken(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    try {
      await this.makeRequest('/auth/validate', {
        method: 'GET',
      });
      return true;
    } catch (error) {
      this.removeToken();
      return false;
    }
  }

  // Métodos para gerenciar token
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  getToken(): string | null {
    return this.token;
  }

  removeToken(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Método para atualizar a URL base da API
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  // Método genérico para outras requisições autenticadas
  async authenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.makeRequest<T>(endpoint, options);
  }
}

// Instância singleton do serviço
const apiService = new ApiService();

export default apiService;