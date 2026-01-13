import React, { useState, useEffect, useCallback } from 'react';
import { Edit, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react';
import apiService, { ApiError, IncomeType, UserIncomeRequest } from '../services/ApiService';

interface IncomeEntry {
  id: number;
  idIncome: number;
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

  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [fetchedIncomeTypes, setFetchedIncomeTypes] = useState<IncomeType[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<number | null>(null);

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString.includes('Z') || dateString.includes('+') ? dateString : dateString + 'Z');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const typesResp = await apiService.getIncomeTypes();
      setFetchedIncomeTypes(typesResp.value);

      const dateParam = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const incomesResp = await apiService.getUserIncomes(dateParam);
      
      const mapped = incomesResp.value.map(apiIncome => ({
        id: apiIncome.id,
        idIncome: apiIncome.idIncome,
        incomeType: typesResp.value.find(t => t.id === apiIncome.idIncome)?.name || 'Desconhecido',
        value: apiIncome.value,
        date: apiIncome.date,
      }));
      setIncomes(mapped);
    } catch (err) {
      setError((err as ApiError).message || 'Erro ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const handleEditClick = (income: IncomeEntry) => {
    setEditingId(income.id);
    setForm({
      incomeType: income.incomeType,
      value: income.value.toString(),
      date: income.date.split('T')[0]
    });
    setSuccess('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ incomeType: '', value: '', date: '' });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Deseja realmente EXCLUIR este lançamento?')) return;
    setIsLoading(true);
    try {
      await apiService.deleteUserIncome(id);
      setSuccess('Renda excluída com sucesso!');
      await fetchAllData();
    } catch (err) {
      setError((err as ApiError).message || 'Erro ao excluir.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (editingId && !window.confirm('Deseja salvar as alterações neste lançamento?')) return;

    setIsLoading(true);
    try {
      const selectedType = fetchedIncomeTypes.find(t => t.name === form.incomeType);
      if (!selectedType) throw { message: 'Tipo de renda inválido.' };

      const data: UserIncomeRequest = {
        value: parseFloat(form.value),
        idIncome: selectedType.id,
        date: new Date(form.date).toISOString()
      };

      if (editingId) {
        await apiService.updateUserIncome(editingId, data);
        setSuccess('Renda atualizada com sucesso!');
      } else {
        await apiService.createUserIncome(data);
        setSuccess('Renda lançada com sucesso!');
      }

      setForm({ incomeType: '', value: '', date: '' });
      setEditingId(null);
      await fetchAllData();
    } catch (err) {
      setError((err as ApiError).message || 'Erro ao processar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {editingId ? 'Editar Renda' : 'Lançar Renda'}
        </h1>
        <p className="text-gray-600">Registre e gerencie suas fontes de renda</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center text-red-700">
          <div className="flex items-center"><AlertCircle className="h-5 w-5 mr-2" /> {error}</div>
          <button onClick={() => setError('')}><X className="h-4 w-4" /></button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center text-green-700">
          <div className="flex items-center"><CheckCircle className="h-5 w-5 mr-2" /> {success}</div>
          <button onClick={() => setSuccess('')}><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="card p-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <label className="text-sm font-medium text-gray-700">Mês:</label>
        <select className="input sm:w-auto" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} disabled={isLoading}>
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <label className="text-sm font-medium text-gray-700">Ano:</label>
        <select className="input sm:w-auto" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} disabled={isLoading}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className={`card p-6 border-2 transition-all ${editingId ? 'border-primary-500 bg-primary-50/10' : 'border-transparent'}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Renda</label>
              <select className="input" value={form.incomeType} onChange={(e) => setForm({ ...form, incomeType: e.target.value })} required disabled={isLoading}>
                <option value="">Selecione um tipo</option>
                {fetchedIncomeTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
              <input type="number" step="0.01" className="input" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required disabled={isLoading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required disabled={isLoading} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="btn bg-gray-200 text-gray-700 px-6 py-2" disabled={isLoading}>Cancelar</button>
            )}
            <button type="submit" className="btn btn-primary px-6 py-2" disabled={isLoading}>
              {editingId ? 'Salvar Alterações' : 'Lançar Renda'}
            </button>
          </div>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {incomes.map(income => (
              <tr key={income.id} className={`hover:bg-gray-50 ${editingId === income.id ? 'bg-primary-50' : ''}`}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{income.incomeType}</td>
                <td className="px-6 py-4 text-sm text-green-600 font-medium">{formatCurrency(income.value)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(income.date)}</td>
                <td className="px-6 py-4 text-sm font-medium flex gap-2">
                  <button onClick={() => handleEditClick(income)} className="text-primary-600 hover:text-primary-900"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(income.id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Income;