import React, { useState, useEffect, useCallback } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import apiService, { ApiError, ExpenseCategory, Expense as ApiExpense } from '../services/ApiService';

interface ExpenseEntry {
  id: number;
  description: string;
  value: number;
  date: string; // String da data no formato YYYY-MM-DD para exibição
  category: string; // Nome da categoria para exibição
  subcategory: string; // Nome da subcategoria para exibição (ou vazia)
}

const Expenses: React.FC = () => {
  const [form, setForm] = useState({
    description: '',
    value: '',
    date: '',
    category: '',
    subcategory: ''
  });

  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [fetchedCategories, setFetchedCategories] = useState<ExpenseCategory[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(false);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState<boolean>(false);

  // Estados para o seletor de mês/ano
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1); // Mês é 0-indexed, então +1
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  const months = [
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' }, { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i); // Ex: Ano atual -2 a Ano atual +2

  const getSubcategories = (categoryName: string) => {
    const categoriesHardcoded = [
      {
        id: 1,
        name: 'Alimentação',
        subcategories: ['Compras', 'Restaurantes', 'Delivery']
      },
      {
        id: 2,
        name: 'Transporte',
        subcategories: ['Combustível', 'Transporte Público', 'Manutenção']
      },
      {
        id: 3,
        name: 'Moradia',
        subcategories: ['Aluguel', 'Condomínio', 'Utilities']
      },
      {
        id: 4,
        name: 'Lazer',
        subcategories: ['Cinema', 'Viagens', 'Hobbies']
      }
    ];
    const category = categoriesHardcoded.find(cat => cat.name === categoryName);
    return category ? category.subcategories : [];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString.includes('Z') || dateString.includes('+') ? dateString : dateString + 'Z');
    
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');

    return `${day}/${month}/${year}`;
  };

  const handleDelete = (id: number) => {
    // Lógica para exclusão local (seria ideal chamar um endpoint DELETE da API)
    setExpenses(expenses.filter(item => item.id !== id));
  };

  const handleCategoryChange = (categoryName: string) => {
    setForm({ ...form, category: categoryName, subcategory: '' });
  };

  // Função para carregar as categorias (separada e estável)
  const loadCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    setError('');
    try {
      const response = await apiService.getExpenseCategories();
      setFetchedCategories(response.value);
      console.log('Categorias de gastos carregadas do backend:', response.value);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Erro ao carregar categorias de gastos.');
      console.error('Erro ao carregar categorias de gastos:', err);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);


  // Função para carregar os gastos (separada e memoizada)
  const loadExpenses = useCallback(async () => {
    // Carrega os gastos apenas se as categorias já foram carregadas
    if (fetchedCategories.length > 0) {
      setIsLoadingExpenses(true);
      setError('');
      try {
        const dateParam = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
        const response = await apiService.getExpenses(dateParam);
        
        const mappedExpenses: ExpenseEntry[] = response.value.map(apiExpense => {
          const categoryName = fetchedCategories.find(cat => cat.id === apiExpense.idCategory)?.name || 'Desconhecida';
          const subcategoryName = (apiExpense.idSubCategory === null || apiExpense.idSubCategory === 0) ? '' : 'Não Mapeada';
          
          return {
            id: apiExpense.id,
            description: apiExpense.description,
            value: apiExpense.value,
            date: apiExpense.date,
            category: categoryName,
            subcategory: subcategoryName,
          };
        });
        setExpenses(mappedExpenses);
        console.log(`Gastos carregados para ${selectedMonth}/${selectedYear}:`, mappedExpenses);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || `Erro ao carregar gastos para ${selectedMonth}/${selectedYear}.`);
        console.error(`Erro ao carregar gastos para ${selectedMonth}/${selectedYear}:`, err);
      } finally {
        setIsLoadingExpenses(false);
      }
    }
  }, [fetchedCategories, selectedMonth, selectedYear]);


  // Efeito para carregar as categorias ao montar o componente
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);


  // Efeito para carregar os gastos (dispara quando loadExpenses muda)
  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.description && form.value && form.date && form.category) {
      const selectedCategory = fetchedCategories.find(cat => cat.name === form.category);
      if (!selectedCategory) {
        setError('Categoria selecionada não é válida ou não foi carregada.');
        return;
      }

      let idSubCategory: number | null = null;
      if (form.subcategory) {
        idSubCategory = 0; // Placeholder ID para subcategoria
      }

      const expenseDataForApi = {
        description: form.description,
        value: parseFloat(form.value),
        date: new Date(form.date).toISOString(),
        idCategory: selectedCategory.id,
        idSubCategory: idSubCategory
      };

      try {
        await apiService.createExpense(expenseDataForApi);
        console.log('Gasto lançado com sucesso!');
        setForm({ description: '', value: '', date: '', category: '', subcategory: '' });
        
        // Após criar, recarrega a lista de gastos com o filtro de data atual
        await loadExpenses(); 
        
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Erro ao lançar gasto.');
        console.error('Erro ao lançar gasto:', err);
      }
    } else {
      setError('Por favor, preencha todos os campos obrigatórios (Descrição, Valor, Data, Categoria).');
    }
  };

  const isLoadingOverall = isLoadingCategories || isLoadingExpenses;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lançar Gasto</h1>
        <p className="text-gray-600">Registre seus gastos e despesas</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-600 ml-2"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Seletor de Mês/Ano */}
      <div className="card p-4 flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
        <label htmlFor="month-select" className="text-sm font-medium text-gray-700">Mês:</label>
        <select
          id="month-select"
          className="input w-full sm:w-auto"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          disabled={isLoadingOverall}
        >
          {months.map((month) => (
            <option key={month.value} value={month.value}>{month.label}</option>
          ))}
        </select>

        <label htmlFor="year-select" className="text-sm font-medium text-gray-700">Ano:</label>
        <select
          id="year-select"
          className="input w-full sm:w-auto"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          disabled={isLoadingOverall}
        >
          {years.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Formulário */}
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4"> {/* Corrigido: adicionada aspa dupla final */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição do Gasto
              </label>
              <input
                type="text"
                id="description"
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                Valor (R$)
              </label>
              <input
                type="number"
                id="value"
                step="0.01"
                min="0"
                className="input"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Data do Gasto
              </label>
              <input
                type="date"
                id="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                id="category"
                className="input"
                value={form.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                required
                disabled={isLoadingOverall}
              >
                <option value="">
                  {isLoadingCategories ? 'Carregando categorias...' : 'Selecione uma categoria'}
                </option>
                {fetchedCategories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
                Subcategoria
              </label>
              <select
                id="subcategory"
                className="input"
                value={form.subcategory}
                onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                disabled={true} // Subcategoria sempre bloqueada
              >
                <option value="">Selecione uma subcategoria</option>
                {getSubcategories(form.category).map((subcategory) => (
                  <option key={subcategory} value={subcategory}>
                    {subcategory}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary px-6 py-2" disabled={isLoadingOverall}>
              Lançar Gasto
            </button>
          </div>
        </form>
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Gastos Lançados</h2>
        </div>
        <div className="overflow-x-auto">
          {isLoadingExpenses ? (
            <div className="p-6 text-center text-gray-600">Carregando gastos...</div>
          ) : expenses.length === 0 ? (
            <div className="p-6 text-center text-gray-600">Nenhum gasto lançado para o mês selecionado.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subcategoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {formatCurrency(expense.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.subcategory}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button className="text-primary-600 hover:text-primary-900 transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Expenses;