import React, { useState, useEffect } from 'react';
import { Edit, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react';
import apiService, { ApiError, IncomeType, IncomeTypeRequest, UpdateIncomeTypeRequest } from '../services/ApiService';

const IncomeTypes: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    description: ''
  });

  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadIncomeTypes = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiService.getIncomeTypes();
      setIncomeTypes(response.value);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Erro ao carregar tipos de renda.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIncomeTypes();
  }, []);

  const handleEditClick = (type: IncomeType) => {
    setEditingId(type.id);
    setForm({
      name: type.name,
      description: type.description
    });
    setSuccess('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', description: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Confirmação para Edição
    if (editingId) {
      if (!window.confirm('Tem certeza que deseja salvar as alterações neste tipo de renda?')) {
        return;
      }
    }

    setIsLoading(true);
    try {
      if (editingId) {
        const updateData: UpdateIncomeTypeRequest = {
          id: editingId,
          name: form.name,
          description: form.description
        };
        await apiService.updateIncomeType(updateData);
        setSuccess('Tipo de renda atualizado com sucesso!');
      } else {
        const newData: IncomeTypeRequest = {
          name: form.name,
          description: form.description
        };
        await apiService.createIncomeType(newData);
        setSuccess('Tipo de renda cadastrado com sucesso!');
      }

      await loadIncomeTypes();
      handleCancelEdit();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Erro ao processar a requisição.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    // Confirmação para Exclusão
    if (!window.confirm('Tem certeza que deseja EXCLUIR permanentemente este tipo de renda?')) {
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await apiService.deleteIncomeType(id);
      setSuccess('Tipo de renda excluído com sucesso!');
      await loadIncomeTypes();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Erro ao excluir tipo de renda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {editingId ? 'Editar Tipo de Renda' : 'Cadastrar Tipos de Renda'}
        </h1>
        <p className="text-gray-600">Gerencie os tipos de renda disponíveis para seus lançamentos</p>
      </div>

      {error && (
        <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span className="flex-1 text-sm font-medium">{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle className="h-5 w-5 mr-2" />
          <span className="flex-1 text-sm font-medium">{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto text-green-400 hover:text-green-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className={`card p-6 border-2 transition-all duration-300 ${editingId ? 'border-primary-500 bg-primary-50/20' : 'border-transparent'}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
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
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                id="description"
                rows={3}
                className="input min-h-[80px] resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="btn bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2"
                disabled={isLoading}
              >
                Cancelar
              </button>
            )}
            <button type="submit" className="btn btn-primary px-6 py-2" disabled={isLoading}>
              {isLoading ? 'Processando...' : editingId ? 'Salvar Alterações' : 'Salvar Tipo de Renda'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tipos de Renda Cadastrados</h2>
        </div>
        <div className="overflow-x-auto">
          {isLoading && incomeTypes.length === 0 ? (
            <div className="p-12 text-center text-gray-500">Carregando dados...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incomeTypes.map((type) => (
                  <tr key={type.id} className={editingId === type.id ? 'bg-primary-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{type.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{type.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button onClick={() => handleEditClick(type)} className="text-primary-600 hover:text-primary-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(type.id)} className="text-red-600 hover:text-red-900">
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

export default IncomeTypes;