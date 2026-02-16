import React, { useState, useEffect } from 'react';
import { Edit, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react';
import apiService, { ApiError, Debited as DebitedType } from '../services/ApiService';

const Debited: React.FC = () => {
  const [name, setName] = useState('');
  const [value, setValue] = useState(''); // Estado para o novo campo valor
  const [items, setItems] = useState<DebitedType[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadItems = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiService.getDebited();
      setItems(response.value);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Erro ao carregar itens.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (editingId && !window.confirm('Deseja salvar as alterações?')) {
      return;
    }

    setIsLoading(true);
    try {
      const requestData = { 
        name, 
        value: parseFloat(value) // Enviando como decimal/number
      };

      if (editingId) {
        await apiService.updateDebited(editingId, requestData);
        setSuccess('Alterado com sucesso!');
      } else {
        await apiService.createDebited(requestData);
        setSuccess('Cadastrado com sucesso!');
      }
      
      setName('');
      setValue('');
      setEditingId(null);
      await loadItems();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Erro ao processar requisição.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja EXCLUIR este item?')) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiService.deleteDebited(id);
      setSuccess('Excluído com sucesso!');
      await loadItems();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Erro ao excluir item.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (item: DebitedType) => {
    setEditingId(item.id);
    setName(item.name);
    setValue(item.value.toString()); // Preenche o campo valor na edição
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Debitado</h1>
        <p className="text-gray-600">Gerencie de onde seus gastos serão debitados</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center text-red-700">
          <div className="flex items-center"><AlertCircle className="h-5 w-5 mr-2" /> {error}</div>
          <button onClick={() => setError('')}><X className="h-4 w-4" /></button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center text-green-700">
          <div className="flex items-center"><CheckCircle className="h-5 w-5 mr-2" /> {success}</div>
          <button onClick={() => setSuccess('')}><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className={`card p-6 border-2 transition-all ${editingId ? 'border-primary-500 bg-primary-50/10' : 'border-transparent'}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                id="name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Cartão de Crédito..."
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
              <input
                type="number"
                step="0.01"
                id="value"
                className="input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Ex: 11000.00"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setName(''); setValue(''); }}
                className="btn bg-gray-200 text-gray-700 px-6 py-2"
                disabled={isLoading}
              >
                Cancelar
              </button>
            )}
            <button type="submit" className="btn btn-primary px-6 py-2" disabled={isLoading}>
              {isLoading ? 'Processando...' : editingId ? 'Salvar Alterações' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Itens Cadastrados</h2>
        </div>
        <div className="overflow-x-auto">
          {isLoading && items.length === 0 ? (
            <div className="p-6 text-center text-gray-600">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-gray-600">Nenhum item cadastrado.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Disponível</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-600">{formatCurrency(item.value)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-4">
                      <button onClick={() => handleEditClick(item)} className="text-primary-600 hover:text-primary-900" title="Editar">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900" disabled={isLoading} title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </button>
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

export default Debited;