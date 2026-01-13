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

export interface UpdateIncomeTypeRequest {
  id: number;
  name: string;
  description: string;
}

export interface UserIncomeRequest {
  value: number;
  idIncome: number;
  date: string; // ISO 8601 format
}

export interface UserIncomeResponse {
  statusCode?: number;
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
  date: string;
  idCategory: number;
  idSubCategory: number | null;
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
        
        let errorMessage = errorData.message;
        if (errorData.errors && errorData.errors.length > 0) {
          errorMessage = errorData.errors[0].message;
        }

        throw {
          success: false,
          message: errorMessage || `HTTP Error: ${response.status}`,
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

  // --- Auth ---
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.makeRequest<LoginResponse>('/user/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (response.success && response.token) this.setToken(response.token);
    return response;
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await this.makeRequest<RegisterResponse>('/User', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (response.success && response.token) this.setToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    try { await this.makeRequest('/user/logout', { method: 'POST' }); } 
    finally { this.removeToken(); }
  }

  async validateToken(): Promise<boolean> {
    if (!this.token) return false;
    try {
      await this.makeRequest('/user/validate', { method: 'GET' });
      return true;
    } catch {
      this.removeToken();
      return false;
    }
  }

  setToken(token: string): void { this.token = token; localStorage.setItem('authToken', token); }
  getToken(): string | null { return this.token; }
  removeToken(): void { this.token = null; localStorage.removeItem('authToken'); }

  // --- Income Types ---
  async createIncomeType(data: IncomeTypeRequest): Promise<IncomeTypeResponse> {
    return this.makeRequest<IncomeTypeResponse>('/income', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateIncomeType(data: UpdateIncomeTypeRequest): Promise<{ statusCode: number }> {
    return this.makeRequest<{ statusCode: number }>('/income', { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteIncomeType(id: number): Promise<{ statusCode: number }> {
    return this.makeRequest<{ statusCode: number }>(`/income/${id}`, { method: 'DELETE' });
  }

  async getIncomeTypes(): Promise<GetIncomeTypesResponse> {
    return this.makeRequest<GetIncomeTypesResponse>('/Income', { method: 'GET' });
  }

  // --- User Incomes ---
  async createUserIncome(data: UserIncomeRequest): Promise<UserIncomeResponse> {
    return this.makeRequest<UserIncomeResponse>('/User/userincome', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateUserIncome(id: number, data: UserIncomeRequest): Promise<{ statusCode: number }> {
    return this.makeRequest<{ statusCode: number }>(`/user/userIncome/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteUserIncome(id: number): Promise<{ statusCode: number }> {
    return this.makeRequest<{ statusCode: number }>(`/user/userIncome/${id}`, { method: 'DELETE' });
  }

  async getUserIncomes(dateString?: string): Promise<GetUserIncomesResponse> {
    let endpoint = '/User/UserIncome';
    if (dateString) endpoint += `?date=${dateString}`;
    return this.makeRequest<GetUserIncomesResponse>(endpoint, { method: 'GET' });
  }

  // --- Expenses & Categories ---
  async createExpenseCategory(data: ExpenseCategoryRequest): Promise<ExpenseCategoryResponse> {
    return this.makeRequest<ExpenseCategoryResponse>('/Category', { method: 'POST', body: JSON.stringify(data) });
  }

  async getExpenseCategories(): Promise<GetExpenseCategoriesResponse> {
    return this.makeRequest<GetExpenseCategoriesResponse>('/Category', { method: 'GET' });
  }

  async deleteExpenseCategory(id: number): Promise<void> {
    await this.makeRequest<void>(`/Category/${id}`, { method: 'DELETE' });
  }

  async updateExpenseCategory(data: UpdateExpenseCategoryRequest): Promise<UpdateExpenseCategoryResponse> {
    return this.makeRequest<UpdateExpenseCategoryResponse>('/Category', { method: 'PUT', body: JSON.stringify(data) });
  }

  async createExpense(data: ExpenseRequest): Promise<ExpenseResponse> {
    return this.makeRequest<ExpenseResponse>('/OutGoing', { method: 'POST', body: JSON.stringify(data) });
  }

  async getExpenses(dateString?: string): Promise<GetExpensesResponse> {
    let endpoint = '/OutGoing';
    if (dateString) endpoint += `?date=${dateString}`;
    return this.makeRequest<GetExpensesResponse>(endpoint, { method: 'GET' });
  }
}

const apiService = new ApiService();
export default apiService;