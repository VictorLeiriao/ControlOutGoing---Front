// src/pages/ExpenseCategories.tsx
import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Tag } from 'lucide-react';
import apiService, { ApiError, ExpenseCategory as ExpenseCategoryType, ExpenseCategoryRequest } from '../services/ApiService';

const ExpenseCategories: React.FC = () => {
  const [form, setForm] = useState({
    name: ''
  });

  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategoryType[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchExpenseCategories = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiService.getExpenseCategories();
      setExpenseCategories(data);
      console.log('Categorias de gastos carregadas.');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Erro ao carregar categorias de gastos.');
      console.error('Erro ao carregar categorias de gastos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenseCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (form.name) {
      try {
        const newCategoryData: ExpenseCategoryRequest = {
          name: form.name
        };

        const response = await apiService.createExpenseCategory(newCategoryData);
        
        // Assuming the response might contain the ID or full object of the created category
        const createdCategory: ExpenseCategoryType = {
          id: response.id || Date.now(), // Use ID from response if available, otherwise client-side
          name: response.name || form.name // Use name from response if available, otherwise form name
        };

        setExpenseCategories([...expenseCategories, createdCategory]);
        setForm({ name: '' });
        console.log('Categoria de gasto salva com sucesso!', response);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Erro ao salvar categoria de gasto.');
        console.error('Erro ao salvar categoria de gasto:', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('O nome da categoria não pode ser vazio.');
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError('');
    setIsLoading(true);
    try {
      await apiService.deleteExpenseCategory(id);
      setExpenseCategories(expenseCategories.filter(item => item.id !== id));
      console.log('Categoria de gasto excluída com sucesso!');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Erro ao excluir categoria de gasto.');
      console.error('Erro ao excluir categoria de gasto:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Categorias de Gastos</h1>
        <p className="text-gray-600">Gerencie as categorias para seus gastos</p>
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
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Categoria
              </label>
              <input
                type="text"
                id="name"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-primary px-6 py-2"
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salvar Categoria'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Categorias Cadastradas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenseCategories.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    Nenhuma categoria cadastrada.
                  </td>
                </tr>
              ) : (
                expenseCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button className="text-primary-600 hover:text-primary-900 transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCategories;