import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import apiService, { 
  ApiError, 
  Expense, 
  ExpenseCategory, 
  UserIncome, 
  OutgoingPerDebited 
} from '../services/ApiService';

interface ChartData {
  name: string;
  value: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#6b7280', '#14b8a6', '#eab308'];

const Dashboard: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [userIncomes, setUserIncomes] = useState<UserIncome[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [outgoingPerDebited, setOutgoingPerDebited] = useState<OutgoingPerDebited[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  
  const [isLoadingExpenses, setIsLoadingExpenses] = useState<boolean>(true);
  const [isLoadingIncomes, setIsLoadingIncomes] = useState<boolean>(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [isLoadingDebitedExpenses, setIsLoadingDebitedExpenses] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  const months = [
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' }, { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i);

  // Carregar Categorias
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await apiService.getExpenseCategories();
        setExpenseCategories(response.value);
      } catch (err) {
        setError('Erro ao carregar categorias.');
      } finally {
        setIsLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  // Carregar dados dependentes da data selecionada
  useEffect(() => {
    const dateParam = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;

    const fetchData = async () => {
      setError('');
      
      // Busca Gastos
      setIsLoadingExpenses(true);
      apiService.getExpenses(dateParam)
        .then(resp => setExpenses(resp.value))
        .catch(() => setError('Erro ao buscar gastos.'))
        .finally(() => setIsLoadingExpenses(false));

      // Busca Rendas
      setIsLoadingIncomes(true);
      apiService.getUserIncomes(dateParam)
        .then(resp => setUserIncomes(resp.value))
        .catch(() => setError('Erro ao buscar rendas.'))
        .finally(() => setIsLoadingIncomes(false));

      // Busca Gastos por Débito (Nova funcionalidade)
      setIsLoadingDebitedExpenses(true);
      apiService.getOutgoingPerDebited(dateParam)
        .then(resp => setOutgoingPerDebited(resp.value))
        .catch(() => setError('Erro ao buscar gastos por débito.'))
        .finally(() => setIsLoadingDebitedExpenses(false));
    };

    fetchData();
  }, [selectedMonth, selectedYear]);

  // Processar dados para o gráfico de pizza
  useEffect(() => {
    if (expenses.length > 0 && expenseCategories.length > 0) {
      const dataMap = new Map<string, number>();
      expenses.forEach(expense => {
        const category = expenseCategories.find(cat => cat.id === expense.idCategory);
        const name = category ? category.name : 'Outros';
        dataMap.set(name, (dataMap.get(name) || 0) + expense.value);
      });
      setChartData(Array.from(dataMap.entries()).map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2))
      })));
    } else {
      setChartData([]);
    }
  }, [expenses, expenseCategories]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.value, 0);
  const totalIncomes = userIncomes.reduce((sum, i) => sum + i.value, 0);
  const isLoadingOverall = isLoadingExpenses || isLoadingIncomes || isLoadingCategories || isLoadingDebitedExpenses;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Financeiro</h1>
        <p className="text-gray-600">Visão geral dos seus gastos e rendas</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center text-red-600">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Filtros */}
      <div className="card p-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <label className="text-sm font-medium">Mês:</label>
        <select className="input w-full sm:w-auto" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <label className="text-sm font-medium">Ano:</label>
        <select className="input w-full sm:w-auto" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card p-6 bg-red-50 border border-red-200">
          <h3 className="text-lg font-semibold text-red-700">Total de Gastos</h3>
          <p className="text-3xl font-bold text-red-800">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="card p-6 bg-green-50 border border-green-200">
          <h3 className="text-lg font-semibold text-green-700">Total de Rendas</h3>
          <p className="text-3xl font-bold text-green-800">{formatCurrency(totalIncomes)}</p>
        </div>
        <div className="card p-6 bg-blue-50 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-700">Saldo Atual</h3>
          <p className="text-3xl font-bold text-blue-800">{formatCurrency(totalIncomes - totalExpenses)}</p>
        </div>
      </div>

      {/* Gráfico de Pizza */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Gastos por Categoria</h2>
        <div className="h-96">
          {isLoadingOverall ? (
            <div className="flex h-full items-center justify-center">Carregando gráfico...</div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-500">Nenhum dado para este mês.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" outerRadius={120} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Valor']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* NOVA SEÇÃO: Gastos por Débito */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Utilização por Conta de Débito</h2>
        {isLoadingDebitedExpenses ? (
          <div className="p-6 text-center text-gray-500">Buscando utilização de contas...</div>
        ) : outgoingPerDebited.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Nenhuma conta com gastos vinculados este mês.</div>
        ) : (
          <div className="space-y-8">
            {outgoingPerDebited.map((item) => {
              const perc = Math.min(item.percentage, 100);
              // Lógica de cor da barra baseada no uso
              let colorClass = "bg-green-500";
              if (perc > 85) colorClass = "bg-red-600";
              else if (perc > 60) colorClass = "bg-orange-500";

              return (
                <div key={item.idDebited} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-sm font-bold text-gray-700 uppercase">{item.debitedName}</span>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(item.valueReached)} / {formatCurrency(item.value)}
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${perc > 85 ? 'text-red-600' : 'text-gray-700'}`}>
                      {item.percentage.toFixed(2)}%
                    </span>
                  </div>
                  
                  {/* Barra de Progresso */}
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                    <div 
                      className={`h-full transition-all duration-700 ease-out ${colorClass} rounded-full`}
                      style={{ width: `${perc}%` }}
                    />
                  </div>

                  {/* Detalhes dos gastos (opcional, para visual melhor) */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {item.expenses.slice(0, 3).map((exp) => (
                      <span key={exp.idOutGoing} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                        {exp.outGoingDesciption}: {formatCurrency(exp.value)}
                      </span>
                    ))}
                    {item.expenses.length > 3 && <span className="text-[10px] text-gray-400">+{item.expenses.length - 3} itens</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;