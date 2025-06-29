import React, { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import apiService, { ApiError } from '../services/ApiService'; // Import apiService and ApiError

interface IncomeEntry {
  id: number;
  incomeType: string;
  value: number;
  date: string;
}

const Income: React.FC = () => {
  const [form, setForm] = useState({
    incomeType: '',
    value: '',
    date: ''
  });

  const [incomes, setIncomes] = useState<IncomeEntry[]>([
    { id: 1, incomeType: 'Salário', value: 5000, date: '2024-01-01' },
    { id: 2, incomeType: 'Freelance', value: 1500, date: '2024-01-15' },
    { id: 3, incomeType: 'Investimentos', value: 300, date: '2024-01-20' }
  ]);

  const incomeTypes = [
    { id: 1, name: 'Salário' },
    { id: 2, name: 'Freelance' },
    { id: 3, name: 'Investimentos' },
    { id: 4, name: 'Outros' }
  ];

  const [error, setError] = useState<string>(''); // State for error messages

  const handleSubmit = async (e: React.FormEvent) => { // Make function async
    e.preventDefault();
    setError(''); // Clear previous errors

    if (form.incomeType && form.value && form.date) {
      const selectedIncomeType = incomeTypes.find(type => type.name === form.incomeType);
      if (!selectedIncomeType) {
        setError('Tipo de renda selecionado não é válido.');
        return;
      }

      const incomeDataForApi = {
        value: parseFloat(form.value),
        idIncome: selectedIncomeType.id,
        date: new Date(form.date).toISOString() // Convert date to ISO string
      };

      try {
        await apiService.createUserIncome(incomeDataForApi); // Call the new API method

        // Add to local state only after successful API call
        const newIncome: IncomeEntry = {
          id: Date.now(), // Generate a client-side ID for new entry
          incomeType: form.incomeType,
          value: parseFloat(form.value),
          date: form.date // Keep original date format for display
        };
        setIncomes([...incomes, newIncome]);
        setForm({ incomeType: '', value: '', date: '' });
        console.log('Renda lançada com sucesso!');
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Erro ao lançar renda.');
        console.error('Erro ao lançar renda:', err);
      }
    }
  };

  const handleDelete = (id: number) => {
    setIncomes(incomes.filter(item => item.id !== id));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
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
              >
                <option value="">Selecione um tipo</option>
                {incomeTypes.map((type) => (
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
            <button type="submit" className="btn btn-primary px-6 py-2">
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
        </div>
      </div>
    </div>
  );
};

export default Income;