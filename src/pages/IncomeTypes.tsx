import React, { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import apiService, { ApiError } from '../services/ApiService';

interface IncomeType {
  id: number;
  name: string;
  description: string;
}

const IncomeTypes: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    description: ''
  });

  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>([
    { id: 1, name: 'Salário', description: 'Salário mensal do trabalho' },
    { id: 2, name: 'Freelance', description: 'Trabalhos freelancer' },
    { id: 3, name: 'Investimentos', description: 'Rendimentos de investimentos' }
  ]);

  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.name && form.description) {
      try {
        const newIncomeTypeData = {
          name: form.name,
          description: form.description
        };

        await apiService.authenticatedRequest<IncomeType>('/income', {
          method: 'POST',
          body: JSON.stringify(newIncomeTypeData),
        });

        // Assuming success if no error is thrown by apiService.authenticatedRequest
        // Assign a client-side ID for display purposes as the API response structure for success was not specified
        const newIncomeType: IncomeType = {
          id: Date.now(),
          name: form.name,
          description: form.description
        };
        setIncomeTypes([...incomeTypes, newIncomeType]);
        setForm({ name: '', description: '' });
        console.log('Tipo de renda salvo com sucesso!');

      } catch (error) {
        const apiError = error as ApiError;
        setError(apiError.message || 'Erro ao salvar tipo de renda.');
        console.error('Erro ao salvar tipo de renda:', error);
      }
    }
  };

  const handleDelete = (id: number) => {
    setIncomeTypes(incomeTypes.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cadastrar Tipos de Renda</h1>
        <p className="text-gray-600">Gerencie os tipos de renda disponíveis</p>
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

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                id="name"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                id="description"
                rows={3}
                className="input min-h-[80px] resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary px-6 py-2">
              Salvar Tipo de Renda
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tipos de Renda Cadastrados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {incomeTypes.map((incomeType) => (
                <tr key={incomeType.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {incomeType.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {incomeType.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button className="text-primary-600 hover:text-primary-900 transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(incomeType.id)}
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

export default IncomeTypes;