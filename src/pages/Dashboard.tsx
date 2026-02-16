import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import apiService, { 
  ApiError, 
  Expense, 
  ExpenseCategory, 
  UserIncome, 
  InvestmentPerType,
  Debited
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
  const [debitedMethods, setDebitedMethods] = useState<Debited[]>([]);
  const [investments, setInvestments] = useState<InvestmentPerType[]>([]);
  
  const [isLoadingExpenses, setIsLoadingExpenses] = useState<boolean>(true);
  const [isLoadingIncomes, setIsLoadingIncomes] = useState<boolean>(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [isLoadingDebited, setIsLoadingDebited] = useState<boolean>(true);
  const [isLoadingInvestments, setIsLoadingInvestments] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chart' | 'debited' | 'investments'>('chart');

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

  useEffect(() => {
    const loadStaticData = async () => {
      setIsLoadingCategories(true);
      setIsLoadingDebited(true);
      try {
        const [catRes, debRes] = await Promise.all([
          apiService.getExpenseCategories(),
          apiService.getDebited()
        ]);
        setExpenseCategories(catRes.value);
        setDebitedMethods(debRes.value);
      } catch (err) {
        setError('Erro ao carregar configurações do dashboard.');
      } finally {
        setIsLoadingCategories(false);
        setIsLoadingDebited(false);
      }
    };
    loadStaticData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const dateParam = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      setIsLoadingExpenses(true);
      setIsLoadingIncomes(true);
      setIsLoadingInvestments(true);
      try {
        const [expRes, incRes, invRes] = await Promise.all([
          apiService.getExpenses(dateParam),
          apiService.getUserIncomes(dateParam),
          apiService.getInvestmentsPerType(dateParam)
        ]);
        setExpenses(expRes.value);
        setUserIncomes(incRes.value);
        setInvestments(invRes.value);
      } catch (err) { console.error(err); } 
      finally {
        setIsLoadingExpenses(false);
        setIsLoadingIncomes(false);
        setIsLoadingInvestments(false);
      }
    };
    loadData();
  }, [selectedMonth, selectedYear]);

  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.value, 0), [expenses]);
  const totalIncomes = useMemo(() => userIncomes.reduce((sum, i) => sum + i.value, 0), [userIncomes]);
  const totalInvested = useMemo(() => investments.reduce((sum, i) => sum + i.valueReached, 0), [investments]);

  const chartData = useMemo(() => {
    const dataMap = new Map<string, number>();
    expenses.forEach(expense => {
      const category = expenseCategories.find(cat => cat.id === expense.idCategory);
      const name = category ? category.name : 'Outros';
      dataMap.set(name, (dataMap.get(name) || 0) + expense.value);
    });
    return Array.from(dataMap.entries()).map(([name, value]) => ({ name, value }));
  }, [expenses, expenseCategories]);

  const debitedSummaryDetailed = useMemo(() => {
    return debitedMethods.map(method => {
      const items = expenses.filter(e => e.idDebited === method.id);
      const total = items.reduce((sum, e) => sum + e.value, 0);
      const percent = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
      return { name: method.name, total, percent, items };
    }).filter(item => item.total > 0);
  }, [expenses, debitedMethods, totalExpenses]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getDebitedColor = (percent: number) => {
    if (percent < 20) return 'bg-green-500'; 
    if (percent < 50) return 'bg-yellow-500';
    if (percent < 80) return 'bg-orange-500';
    return 'bg-red-500'; 
  };

  const getInvestmentColor = (percent: number) => {
    if (percent < 33) return 'bg-red-500'; 
    if (percent < 66) return 'bg-yellow-500';
    return 'bg-green-500'; 
  };

  const isLoadingOverall = isLoadingExpenses || isLoadingIncomes || isLoadingCategories || isLoadingDebited || isLoadingInvestments;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Financeiro</h1>
        <p className="text-gray-600">Gestão integrada de gastos, rendas e investimentos</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {/* Seletor de Data */}
      <div className="card p-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Mês:</label>
          <select className="input w-full sm:w-auto" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} disabled={isLoadingOverall}>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Ano:</label>
          <select className="input w-full sm:w-auto" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} disabled={isLoadingOverall}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 bg-red-50 border border-red-200">
          <h3 className="text-xs font-semibold text-red-700 uppercase mb-2">Total de Gastos</h3>
          <p className="text-2xl font-bold text-red-800">{isLoadingExpenses ? '...' : formatCurrency(totalExpenses)}</p>
        </div>
        <div className="card p-6 bg-green-50 border border-green-200">
          <h3 className="text-xs font-semibold text-green-700 uppercase mb-2">Total de Rendas</h3>
          <p className="text-2xl font-bold text-green-800">{isLoadingIncomes ? '...' : formatCurrency(totalIncomes)}</p>
        </div>
        <div className="card p-6 bg-indigo-50 border border-indigo-200">
          <h3 className="text-xs font-semibold text-indigo-700 uppercase mb-2">Investimentos</h3>
          <p className="text-2xl font-bold text-indigo-800">{isLoadingInvestments ? '...' : formatCurrency(totalInvested)}</p>
        </div>
        <div className="card p-6 bg-blue-50 border border-blue-200">
          <h3 className="text-xs font-semibold text-blue-700 uppercase mb-2">Saldo Atual</h3>
          <p className="text-2xl font-bold text-blue-800">{isLoadingOverall ? '...' : formatCurrency(totalIncomes - totalExpenses - totalInvested)}</p>
        </div>
      </div>

      <div className="card p-6">
        {/* Navegação por Abas */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          <button onClick={() => setActiveTab('chart')} className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'chart' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Gráfico de Gastos</button>
          <button onClick={() => setActiveTab('debited')} className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'debited' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Gastos por Débito</button>
          <button onClick={() => setActiveTab('investments')} className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'investments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Investimentos</button>
        </div>

        <div className="min-h-[450px]">
          {activeTab === 'chart' && (
            <div className="h-[450px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={140} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-gray-400">Nenhum gasto registrado.</div>}
            </div>
          )}

          {activeTab === 'debited' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {debitedSummaryDetailed.map((deb, idx) => (
                <div key={idx} className="p-6 border border-gray-100 bg-gray-50/30 rounded-3xl">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-black text-gray-900 text-xl">{deb.name}</h4>
                      <p className="text-xs text-gray-400 font-bold uppercase">Representação no Orçamento</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-gray-900">{formatCurrency(deb.total)}</span>
                      <p className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-block ml-2 ${deb.percent > 75 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                        {deb.percent.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-6 overflow-hidden p-1">
                    <div className={`h-full rounded-full transition-all duration-1000 ${getDebitedColor(deb.percent)}`} style={{ width: `${Math.min(deb.percent, 100)}%` }}></div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Detalhes dos Lançamentos</p>
                    {deb.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">{item.description}</span>
                        <span className="font-bold text-gray-800">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'investments' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {investments.map((inv) => (
                <div key={inv.idInvestmentType} className="p-6 border border-indigo-50 bg-indigo-50/30 rounded-3xl">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-black text-gray-900 text-xl">{inv.descriptionInvestmentType}</h4>
                      <p className="text-xs text-gray-400 font-bold uppercase">Meta: {formatCurrency(inv.value)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-indigo-600">{formatCurrency(inv.valueReached)}</span>
                      <p className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-block ml-2 ${inv.percentage >= 100 ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {inv.percentage}%
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-6 overflow-hidden p-1">
                    <div className={`h-full rounded-full transition-all duration-1000 ${getInvestmentColor(inv.percentage)}`} style={{ width: `${Math.min(inv.percentage, 100)}%` }}></div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-100 pb-2">Extrato de Aportes</p>
                    {inv.investments.map((item) => (
                      <div key={item.idInvestment} className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">{item.descriptionInvestment}</span>
                        <span className="font-bold text-gray-800">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;