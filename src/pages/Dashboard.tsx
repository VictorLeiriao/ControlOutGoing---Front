import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import apiService, { ApiError, Expense, ExpenseCategory, UserIncome } from '../services/ApiService'; // Import UserIncome

interface ChartData {
  name: string; // Nome da categoria
  value: number; // Total gasto na categoria
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#6b7280', '#14b8a6', '#eab308'];

const Dashboard: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [userIncomes, setUserIncomes] = useState<UserIncome[]>([]); // Novo estado para rendas do usuário
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState<boolean>(true); // Loading individual para gastos
  const [isLoadingIncomes, setIsLoadingIncomes] = useState<boolean>(true); // Loading individual para rendas
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true); // Loading individual para categorias
  const [error, setError] = useState<string>('');

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

  // Carregar Categorias de Gastos
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      setError('');
      try {
        const response = await apiService.getExpenseCategories();
        setExpenseCategories(response.value);
        console.log('Categorias de gastos carregadas para o Dashboard:', response.value);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Erro ao carregar categorias de gastos para o dashboard.');
        console.error('Erro ao carregar categorias de gastos para o dashboard:', err);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Carregar Gastos (depende das categorias e da data selecionada)
  useEffect(() => {
    const loadExpenses = async () => {
      if (expenseCategories.length > 0) { // Garante que as categorias já foram carregadas
        setIsLoadingExpenses(true);
        setError('');
        try {
          const dateParam = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
          const response = await apiService.getExpenses(dateParam);
          setExpenses(response.value);
          console.log(`Gastos carregados para ${selectedMonth}/${selectedYear}:`, response.value);
        } catch (err) {
          const apiError = err as ApiError;
          setError(apiError.message || `Erro ao carregar gastos para ${selectedMonth}/${selectedYear}.`);
          console.error(`Erro ao carregar gastos para ${selectedMonth}/${selectedYear}:`, err);
        } finally {
          setIsLoadingExpenses(false);
        }
      }
    };

    loadExpenses();
  }, [expenseCategories, selectedMonth, selectedYear]);

  // Carregar Rendas (depende da data selecionada)
  useEffect(() => {
    const loadIncomes = async () => {
      setIsLoadingIncomes(true);
      setError('');
      try {
        const dateParam = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
        const response = await apiService.getUserIncomes(dateParam); // Chama o novo método com o filtro de data
        setUserIncomes(response.value);
        console.log(`Rendas carregadas para ${selectedMonth}/${selectedYear}:`, response.value);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || `Erro ao carregar rendas para ${selectedMonth}/${selectedYear}.`);
        console.error(`Erro ao carregar rendas para ${selectedMonth}/${selectedYear}:`, err);
      } finally {
        setIsLoadingIncomes(false);
      }
    };

    loadIncomes();
  }, [selectedMonth, selectedYear]); // Depende apenas da data, pois não precisa de mapeamento de tipos

  // Processar dados para o gráfico quando gastos ou categorias mudam
  useEffect(() => {
    if (expenses.length > 0 && expenseCategories.length > 0) {
      const dataMap = new Map<string, number>();

      expenses.forEach(expense => {
        const category = expenseCategories.find(cat => cat.id === expense.idCategory);
        const categoryName = category ? category.name : 'Outros/Desconhecido';
        
        const currentValue = dataMap.get(categoryName) || 0;
        dataMap.set(categoryName, currentValue + expense.value);
      });

      const processedData: ChartData[] = Array.from(dataMap.entries()).map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2))
      }));
      setChartData(processedData);
      console.log('Dados para o gráfico processados:', processedData);
    } else if (!isLoadingExpenses && expenses.length === 0 && expenseCategories.length > 0) {
      // Se não há gastos, mas as categorias foram carregadas, limpa os dados do gráfico
      setChartData([]);
    }
  }, [expenses, expenseCategories, isLoadingExpenses]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalExpenses = chartData.reduce((sum, item) => sum + item.value, 0);
  const totalIncomes = userIncomes.reduce((sum, item) => sum + item.value, 0); // Calcula o total de rendas

  const isLoadingOverall = isLoadingExpenses || isLoadingIncomes || isLoadingCategories; // Carregamento geral

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Financeiro</h1>
        <p className="text-gray-600">Visão geral dos seus gastos e rendas</p>
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
      <div className="card p-4 flex flex-col sm:flex-row items-center justify-center gap-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card de Total de Gastos */}
        <div className="card p-6 bg-red-50 border border-red-200">
          <h3 className="text-lg font-semibold text-red-700 mb-2">Total de Gastos</h3>
          {isLoadingExpenses ? (
            <p className="text-xl font-bold text-red-800">Carregando...</p>
          ) : (
            <p className="text-3xl font-bold text-red-800">{formatCurrency(totalExpenses)}</p>
          )}
        </div>

        {/* Card de Total de Rendas */}
        <div className="card p-6 bg-green-50 border border-green-200">
          <h3 className="text-lg font-semibold text-green-700 mb-2">Total de Rendas</h3>
          {isLoadingIncomes ? (
            <p className="text-xl font-bold text-green-800">Carregando...</p>
          ) : (
            <p className="text-3xl font-bold text-green-800">{formatCurrency(totalIncomes)}</p>
          )}
        </div>

        {/* Card de Saldo */}
        <div className="card p-6 bg-blue-50 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-700 mb-2">Saldo Atual</h3>
          {isLoadingOverall ? (
            <p className="text-xl font-bold text-blue-800">Carregando...</p>
          ) : (
            <p className="text-3xl font-bold text-blue-800">{formatCurrency(totalIncomes - totalExpenses)}</p>
          )}
        </div>
      </div>

      {/* Seção do Gráfico de Pizza */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          Gastos por Categoria
        </h2>
        {isLoadingOverall ? (
          <div className="p-6 text-center text-gray-600">Carregando dados do gráfico...</div>
        ) : chartData.length === 0 ? (
          <div className="p-6 text-center text-gray-600">Nenhum gasto encontrado para o mês selecionado.</div>
        ) : (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8" // Cor padrão, será sobrescrita pelas Cell
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${formatCurrency(value)}`, 'Valor']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;