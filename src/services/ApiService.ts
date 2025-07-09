export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    userName: string;
    email?: string;
  };
  message?: string;
}

export interface RegisterRequest {
  userName: string;
  email: string;
  document: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    userName: string;
    email: string;
  };
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  status?: number;
}

export interface IncomeTypeRequest {
  name: string;
  description: string;
}

export interface IncomeTypeResponse {
  // Assuming a 200 OK means a successful operation,
  // the response body might be empty or contain a simple success message.
  // Adjust this interface if the backend returns specific data on success.
}

export interface UserIncomeRequest {
  value: number;
  idIncome: number;
  date: string; // ISO 8601 format
}

export interface UserIncomeResponse {
  // Assuming 200 OK means a successful operation,
  // the response body might be empty or contain a simple success message.
}

export interface ExpenseCategory {
  id: number; // Assuming the backend returns an ID for existing categories
  name: string;
}

export interface ExpenseCategoryRequest {
  name: string;
}

export interface ExpenseCategoryResponse {
  // Assuming 200 OK means a successful operation for POST
  // The response might be empty or return the created category with an ID
  id?: number;
  name?: string;
}

export interface GetExpenseCategoriesResponse {
  value: ExpenseCategory[];
  formatters: any[]; // You can define a more specific type if needed
  contentTypes: any[]; // You can define a more specific type if needed
  declaredType: any | null;
  statusCode: number;
}

export interface ExpenseRequest {
  description: string;
  value: number;
  date: string; // ISO 8601 format
  idCategory: number;
  idSubCategory: number | null; // Can be null
}

export interface ExpenseResponse {
  // Assuming 200 OK means a successful operation
  // The response might be empty or return the created expense with an ID
}

// New interfaces for fetching expenses
export interface Expense {
  id: number;
  idUser: number;
  description: string;
  value: number;
  date: string;
  idCategory: number;
  idSubCategory: number | null;
}

export interface GetExpensesResponse {
  value: Expense[];
  formatters: any[];
  contentTypes: any[];
  declaredType: null;
  statusCode: number;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'https://localhost:7188/api/v1') {
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

      // Handle cases where response might be 204 No Content or similar
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        // Return an empty object for successful responses with no content
        return {} as T;
      }

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
      const response = await this.makeRequest<LoginResponse>('/user/login', {
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
      console.log(userData);
      const response = await this.makeRequest<RegisterResponse>('/User', {
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
      await this.makeRequest('/user/logout', {
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
      await this.makeRequest('/user/validate', {
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

  // Method for creating an income type
  async createIncomeType(incomeTypeData: IncomeTypeRequest): Promise<IncomeTypeResponse> {
    try {
      const response = await this.makeRequest<IncomeTypeResponse>('/income', {
        method: 'POST',
        body: JSON.stringify(incomeTypeData),
      });
      return response;
    } catch (error) {
      console.error('Erro ao criar tipo de renda:', error);
      throw error;
    }
  }

  // Method for creating a user income entry
  async createUserIncome(incomeData: UserIncomeRequest): Promise<UserIncomeResponse> {
    try {
      const response = await this.makeRequest<UserIncomeResponse>('/User/userincome', {
        method: 'POST',
        body: JSON.stringify(incomeData),
      });
      return response;
    } catch (error) {
      console.error('Erro ao lançar renda do usuário:', error);
      throw error;
    }
  }

  // Method for creating an expense category
  async createExpenseCategory(categoryData: ExpenseCategoryRequest): Promise<ExpenseCategoryResponse> {
    try {
      const response = await this.makeRequest<ExpenseCategoryResponse>('/Category', {
        method: 'POST',
        body: JSON.stringify(categoryData),
      });
      return response;
    } catch (error) {
      console.error('Erro ao criar categoria de gasto:', error);
      throw error;
    }
  }

  // Method for getting all expense categories
  async getExpenseCategories(): Promise<GetExpenseCategoriesResponse> {
    try {
      const response = await this.makeRequest<GetExpenseCategoriesResponse>('/Category', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Erro ao buscar categorias de gasto:', error);
      throw error;
    }
  }

  // Method for deleting an expense category (placeholder endpoint)
  async deleteExpenseCategory(id: number): Promise<void> {
    try {
      await this.makeRequest<void>(`/Category/${id}`, {
        method: 'DELETE',
      });
      console.log(`Categoria ${id} excluída com sucesso.`);
    } catch (error) {
      console.error(`Erro ao excluir categoria ${id}:`, error);
      throw error;
    }
  }

  // Method for creating an expense
  async createExpense(expenseData: ExpenseRequest): Promise<ExpenseResponse> {
    try {
      const response = await this.makeRequest<ExpenseResponse>('/OutGoing', {
        method: 'POST',
        body: JSON.stringify(expenseData),
      });
      return response;
    } catch (error) {
      console.error('Erro ao criar gasto:', error);
      throw error;
    }
  }

  // New method for getting all expenses
  async getExpenses(): Promise<GetExpensesResponse> {
    try {
      const response = await this.makeRequest<GetExpensesResponse>('/OutGoing', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Erro ao buscar gastos:', error);
      throw error;
    }
  }
}

// Instância singleton do serviço
const apiService = new ApiService();

export default apiService;