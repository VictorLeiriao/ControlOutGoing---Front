import React, { useState, useEffect, useCallback } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import apiService, { ApiError, IncomeType, UserIncomeRequest, UserIncome as ApiUserIncome } from '../services/ApiService';

interface IncomeEntry {
  id: number;
  incomeType: string; // Nome do tipo de renda para exibição
  value: number;
  date: string; // String da data no formato YYYY-MM-DD para exibição
}

const Income: React.FC = () => {
  const [form, setForm] = useState({
    incomeType: '',
    value: '',
    date: ''
  });

  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [fetchedIncomeTypes, setFetchedIncomeTypes] = useState<IncomeType[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true); // Estado de carregamento unificado

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
    setIncomes(incomes.filter(item => item.id !== id));
  };

  // Função centralizada para buscar todos os dados necessários da tela
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // 1. Buscar Tipos de Renda
      const incomeTypesResponse = await apiService.getIncomeTypes();
      const loadedIncomeTypes = incomeTypesResponse.value;
      setFetchedIncomeTypes(loadedIncomeTypes);

      // 2. Buscar Rendas do Usuário (depende dos tipos de renda e da data selecionada)
      const dateParam = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const incomesResponse = await apiService.getUserIncomes(dateParam);
      
      const mappedIncomes: IncomeEntry[] = incomesResponse.value.map(apiIncome => {
        const incomeTypeName = loadedIncomeTypes.find(type => type.id === apiIncome.idIncome)?.name || 'Desconhecido';
        return {
          id: apiIncome.id,
          incomeType: incomeTypeName,
          value: apiIncome.value,
          date: apiIncome.date,
        };
      });
      setIncomes(mappedIncomes);
      console.log(`Dados de renda carregados para ${selectedMonth}/${selectedYear}.`);

    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Erro ao carregar dados da tela Rendas.');
      console.error('Erro ao carregar dados da tela Rendas:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]); // Dependências: re-executa quando mês/ano mudam

  // Efeito para disparar o carregamento inicial e recarregamentos por mudança de data
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]); // Dependência: a função memoizada fetchAllData


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true); // Desabilitar o formulário enquanto submete

    if (form.incomeType && form.value && form.date) {
      const selectedIncomeType = fetchedIncomeTypes.find(type => type.name === form.incomeType);
      if (!selectedIncomeType) {
        setError('Tipo de renda selecionado não é válido ou não foi carregado.');
        setIsLoading(false);
        return;
      }

      const incomeDataForApi: UserIncomeRequest = {
        value: parseFloat(form.value),
        idIncome: selectedIncomeType.id,
        date: new Date(form.date).toISOString()
      };

      try {
        await apiService.createUserIncome(incomeDataForApi);
        console.log('Renda lançada com sucesso!');
        setForm({ incomeType: '', value: '', date: '' });
        
        // Re-fetch all data to refresh the table with the new entry and current filter
        await fetchAllData(); 
        
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Erro ao lançar renda.');
        console.error('Erro ao lançar renda:', err);
      } finally {
        setIsLoading(false); // Reabilitar o formulário
      }
    } else {
      setError('Por favor, preencha todos os campos obrigatórios (Tipo de Renda, Valor, Data).');
      setIsLoading(false);
    }
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lançar Renda</h1>
        <p className="text-gray-600">Registre suas fontes de renda</p>
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
          disabled={isLoading}
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
          disabled={isLoading}
        >
          {years.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Formulário */}
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="incomeType" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Renda
              </label>
              <select
                id="incomeType"
                className="input"
                value={form.incomeType}
                onChange={(e) => setForm({ ...form, incomeType: e.target.value })}
                required
                disabled={isLoading}
              >
                <option value="">
                  {isLoading ? 'Carregando tipos...' : 'Selecione um tipo'}
                </option>
                {fetchedIncomeTypes.map((type) => (
                  <option key={type.id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
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
                Data de Recebimento
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
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary px-6 py-2" disabled={isLoading}>
              Lançar Renda
            </button>
          </div>
        </form>
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Rendas Lançadas</h2>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 text-center text-gray-600">Carregando rendas...</div>
          ) : incomes.length === 0 ? (
            <div className="p-6 text-center text-gray-600">Nenhuma renda lançada para o mês selecionado.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo de Renda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incomes.map((income) => (
                  <tr key={income.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {income.incomeType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {formatCurrency(income.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(income.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button className="text-primary-600 hover:text-primary-900 transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(income.id)}
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

export default Income;