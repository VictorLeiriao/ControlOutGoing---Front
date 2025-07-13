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

export interface IncomeType {
  id: number;
  name: string;
  description: string;
}

export interface IncomeTypeRequest {
  name: string;
  description: string;
}

export interface IncomeTypeResponse {
  id?: number;
  name?: string;
  description?: string;
}

export interface GetIncomeTypesResponse {
  value: IncomeType[];
  formatters: any[];
  contentTypes: any[];
  declaredType: null;
  statusCode: number;
}

export interface UserIncomeRequest {
  value: number;
  idIncome: number;
  date: string; // ISO 8601 format
}

export interface UserIncomeResponse {
}

export interface ExpenseCategory {
  id: number;
  name: string;
}

export interface ExpenseCategoryRequest {
  name: string;
}

export interface ExpenseCategoryResponse {
  id?: number;
  name?: string;
}

export interface GetExpenseCategoriesResponse {
  value: ExpenseCategory[];
  formatters: any[];
  contentTypes: any[];
  declaredType: null;
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
}

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

export interface UserIncome {
  id: number;
  idIncome: number;
  date: string;
  value: number;
}

export interface GetUserIncomesResponse {
  value: UserIncome[];
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

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

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

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
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

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await this.makeRequest<LoginResponse>('/user/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (response.success && response.token) {
        this.setToken(response.token);
      }

      return response;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      console.log(userData);
      const response = await this.makeRequest<RegisterResponse>('/User', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.success && response.token) {
        this.setToken(response.token);
      }

      return response;
    } catch (error) {
      console.error('Erro no cadastro:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.makeRequest('/user/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      this.removeToken();
    }
  }

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

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  async authenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.makeRequest<T>(endpoint, options);
  }

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

  async getIncomeTypes(): Promise<GetIncomeTypesResponse> {
    try {
      const response = await this.makeRequest<GetIncomeTypesResponse>('/Income', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Erro ao buscar tipos de renda:', error);
      throw error;
    }
  }

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

  async getExpenses(dateString?: string): Promise<GetExpensesResponse> {
    try {
      let endpoint = '/OutGoing';
      if (dateString) {
        endpoint += `?date=${dateString}`;
      }
      const response = await this.makeRequest<GetExpensesResponse>(endpoint, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Erro ao buscar gastos:', error);
      throw error;
    }
  }

  // Modified method: now accepts a dateString for filtering
  async getUserIncomes(dateString?: string): Promise<GetUserIncomesResponse> {
    try {
      let endpoint = '/User/UserIncome';
      if (dateString) {
        endpoint += `?date=${dateString}`;
      }
      const response = await this.makeRequest<GetUserIncomesResponse>(endpoint, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Erro ao buscar rendas do usuário:', error);
      throw error;
    }
  }
}

const apiService = new ApiService();

export default apiService;