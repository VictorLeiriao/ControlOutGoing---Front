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

export interface UpdateExpenseCategoryRequest {
  id: number;
  name: string;
}

export interface ExpenseCategoryResponse {
  id?: number;
  name?: string;
}

export interface UpdateExpenseCategoryResponse {
  value: ExpenseCategory;
  formatters: any[];
  contentTypes: any[];
  declaredType: null;
  statusCode: number;
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
  idSubCategory: number | null;
  idDebited: number; 
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
  idDebited: number;
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

export interface Debited {
  id: number;
  name: string;
}

export interface DebitedRequest {
  name: string;
}

export interface GetDebitedResponse {
  value: Debited[];
  formatters: any[];
  contentTypes: any[];
  declaredType: null;
  statusCode: number;
}

// INTERFACES PARA INVESTIMENTOS
export interface InvestmentItem {
  idInvestment: number;
  descriptionInvestment: string;
  value: number;
}

export interface InvestmentPerType {
  idInvestmentType: number;
  descriptionInvestmentType: string;
  value: number; // Meta/Objetivo
  valueReached: number; // Valor já investido
  percentage: number;
  investments: InvestmentItem[];
}

export interface GetInvestmentsPerTypeResponse {
  value: InvestmentPerType[];
  formatters: any[];
  contentTypes: any[];
  declaredType: null;
  statusCode: number;
}

export interface InvestmentType {
  id: number;
  description: string;
  value: number;
}

export interface InvestmentTypeRequest {
  description: string;
  value: number;
}

export interface GetInvestmentTypesResponse {
  value: InvestmentType[];
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
        
        let errorMessage = errorData.message || `HTTP Error: ${response.status}`;
        if (errorData.errors && errorData.errors.length > 0) {
          errorMessage = errorData.errors[0].message;
        }

        throw {
          success: false,
          message: errorMessage,
          status: response.status,
        } as ApiError;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return { statusCode: response.status } as unknown as T;
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
    } catch (error) {
      console.error(`Erro ao excluir categoria ${id}:`, error);
      throw error;
    }
  }

  async updateExpenseCategory(categoryData: UpdateExpenseCategoryRequest): Promise<UpdateExpenseCategoryResponse> {
    try {
      const response = await this.makeRequest<UpdateExpenseCategoryResponse>('/Category', {
        method: 'PUT',
        body: JSON.stringify(categoryData),
      });
      return response;
    } catch (error) {
      console.error(`Erro ao atualizar categoria ${categoryData.id}:`, error);
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

  async deleteExpense(id: number) { return this.makeRequest<any>(`/OutGoing/${id}`, { method: 'DELETE' }); }

  async getExpenses(dateString?: string): Promise<GetExpensesResponse> {
    try {
      let endpoint = '/OutGoing';
      if (dateString) {
        endpoint += `?date=${dateString}`;
      }
      return await this.makeRequest<GetExpensesResponse>(endpoint, { method: 'GET' });
    } catch (error) {
      console.error('Erro ao buscar gastos:', error);
      throw error;
    }
  }

  async getUserIncomes(dateString?: string): Promise<GetUserIncomesResponse> {
    try {
      let endpoint = '/User/UserIncome';
      if (dateString) {
        endpoint += `?date=${dateString}`;
      }
      return await this.makeRequest<GetUserIncomesResponse>(endpoint, { method: 'GET' });
    } catch (error) {
      console.error('Erro ao buscar rendas do usuário:', error);
      throw error;
    }
  }

  async getDebited(): Promise<GetDebitedResponse> {
    return this.makeRequest<GetDebitedResponse>('/Debited', { method: 'GET' });
  }

  async createDebited(data: DebitedRequest): Promise<void> {
    return this.makeRequest<void>('/Debited', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDebited(id: number, data: DebitedRequest): Promise<void> {
    return this.makeRequest<void>(`/Debited/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDebited(id: number): Promise<void> {
    return this.makeRequest<void>(`/Debited/${id}`, {
      method: 'DELETE',
    });
  }

  async getInvestmentsPerType(dateString?: string): Promise<GetInvestmentsPerTypeResponse> {
    try {
      let endpoint = '/dashboard/investmentpertype';
      if (dateString) {
        endpoint += `?date=${dateString}`;
      }
      return await this.makeRequest<GetInvestmentsPerTypeResponse>(endpoint, { method: 'GET' });
    } catch (error) {
      console.error('Erro ao buscar investimentos por tipo:', error);
      throw error;
    }
  }

  // MÉTODOS PARA TIPO DE INVESTIMENTO
  async getInvestmentTypes(): Promise<GetInvestmentTypesResponse> {
    return this.makeRequest<GetInvestmentTypesResponse>('/Investment/InvestmentType', { 
      method: 'GET' 
    });
  }

  async createInvestmentType(data: InvestmentTypeRequest): Promise<void> {
    return this.makeRequest<void>('/Investment/InvestmentType', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInvestmentType(id: number, data: InvestmentTypeRequest): Promise<void> {
    return this.makeRequest<void>(`/Investment/InvestmentType/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInvestmentType(id: number): Promise<void> {
    return this.makeRequest<void>(`/Investment/InvestmentType/${id}`, {
      method: 'DELETE',
    });
  }



}

const apiService = new ApiService();
export default apiService;