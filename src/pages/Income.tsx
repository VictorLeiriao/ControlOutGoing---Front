import React, { useState, useEffect } from 'react';
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
  const [isLoadingIncomeTypes, setIsLoadingIncomeTypes] = useState<boolean>(false);
  const [isLoadingIncomes, setIsLoadingIncomes] = useState<boolean>(false);

  // Função para carregar os tipos de renda do backend
  const loadIncomeTypes = async () => {
    setIsLoadingIncomeTypes(true);
    setError('');
    try {
      const response = await apiService.getIncomeTypes();
      setFetchedIncomeTypes(response.value);
      console.log('Tipos de renda carregados do backend:', response.value);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Erro ao carregar tipos de renda.');
      console.error('Erro ao carregar tipos de renda:', err);
    } finally {
      setIsLoadingIncomeTypes(false);
    }
  };

  // Função para carregar as rendas do usuário do backend
  const loadIncomes = async () => {
    setIsLoadingIncomes(true);
    setError('');
    try {
      const response = await apiService.getUserIncomes();
      // Mapeia os dados da API para o formato IncomeEntry da tabela
      const mappedIncomes: IncomeEntry[] = response.value.map(apiIncome => {
        const incomeTypeName = fetchedIncomeTypes.find(type => type.id === apiIncome.idIncome)?.name || 'Desconhecido';
        
        return {
          id: apiIncome.id,
          incomeType: incomeTypeName,
          value: apiIncome.value,
          date: apiIncome.date, // Manter a string de data/hora completa aqui
        };
      });
      setIncomes(mappedIncomes);
      console.log('Rendas carregadas do backend:', mappedIncomes);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Erro ao carregar rendas.');
      console.error('Erro ao carregar rendas:', err);
    } finally {
      setIsLoadingIncomes(false);
    }
  };


  // Efeito para carregar os tipos de renda ao montar o componente
  useEffect(() => {
    loadIncomeTypes();
  }, []);

  // Efeito para carregar as rendas somente após os tipos de renda estarem disponíveis
  useEffect(() => {
    if (fetchedIncomeTypes.length > 0) {
      loadIncomes();
    }
  }, [fetchedIncomeTypes]); // Depende de fetchedIncomeTypes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.incomeType && form.value && form.date) {
      const selectedIncomeType = fetchedIncomeTypes.find(type => type.name === form.incomeType);
      if (!selectedIncomeType) {
        setError('Tipo de renda selecionado não é válido ou não foi carregado.');
        return;
      }

      const incomeDataForApi: UserIncomeRequest = {
        value: parseFloat(form.value),
        idIncome: selectedIncomeType.id,
        date: new Date(form.date).toISOString()
      };

      try {
        await apiService.createUserIncome(incomeDataForApi);

        // Após criar, recarrega a lista de rendas do backend
        await loadIncomes();

        setForm({ incomeType: '', value: '', date: '' });
        console.log('Renda lançada com sucesso!');
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Erro ao lançar renda.');
        console.error('Erro ao lançar renda:', err);
      }
    } else {
      setError('Por favor, preencha todos os campos obrigatórios (Tipo de Renda, Valor, Data).');
    }
  };

  const handleDelete = (id: number) => {
    // Lógica para exclusão local (seria ideal chamar um endpoint DELETE da API)
    setIncomes(incomes.filter(item => item.id !== id));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função formatDate ajustada para lidar com a data do backend (YYYY-MM-DDTHH:mm:ss)
  const formatDate = (dateString: string) => {
    // Adiciona 'Z' para garantir que seja interpretado como UTC, se não tiver.
    // Isso é crucial para evitar o problema de "dia -1" em fusos horários negativos.
    const date = new Date(dateString.includes('Z') || dateString.includes('+') ? dateString : dateString + 'Z');
    
    // Extrai componentes da data em UTC para garantir que o dia não mude
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Mês é 0-indexed
    const day = date.getUTCDate().toString().padStart(2, '0');

    return `${day}/${month}/${year}`;
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
                disabled={isLoadingIncomeTypes}
              >
                <option value="">
                  {isLoadingIncomeTypes ? 'Carregando tipos...' : 'Selecione um tipo'}
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
            <button type="submit" className="btn btn-primary px-6 py-2" disabled={isLoadingIncomeTypes}>
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
          {isLoadingIncomes ? (
            <div className="p-6 text-center text-gray-600">Carregando rendas...</div>
          ) : incomes.length === 0 ? (
            <div className="p-6 text-center text-gray-600">Nenhuma renda lançada.</div>
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