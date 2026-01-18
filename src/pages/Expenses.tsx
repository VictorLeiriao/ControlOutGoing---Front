import React, { useState, useEffect, useCallback } from 'react';
import { Edit, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react';
import apiService, { ApiError, ExpenseCategory, Debited } from '../services/ApiService';

interface ExpenseEntry {
  id: number;
  description: string;
  value: number;
  date: string;
  category: string;
  debited: string; // Exibição amigável do nome da conta
}

const Expenses: React.FC = () => {
  const [form, setForm] = useState({ description: '', value: '', date: '', category: '', debited: '' });
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [debitedSources, setDebitedSources] = useState<Debited[]>([]); // Novo estado para dropdown
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const months = [{ value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' }, { value: 3, label: 'Março' }, { value: 4, label: 'Abril' }, { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' }, { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Setembro' }, { value: 10, label: 'Outubro' }, { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' }];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const fetchData = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const [catResp, debResp] = await Promise.all([
        apiService.getExpenseCategories(),
        apiService.getDebited() // Busca dados do novo endpoint
      ]);
      setCategories(catResp.value);
      setDebitedSources(debResp.value);

      const dateParam = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const expResp = await apiService.getExpenses(dateParam);
      
      const mapped = expResp.value.map(e => ({
        id: e.id,
        description: e.description,
        value: e.value,
        date: e.date,
        category: catResp.value.find(c => c.id === e.idCategory)?.name || 'Outros',
        debited: debResp.value.find(d => d.id === e.idDebited)?.name || 'N/A' // Mapeia idDebited para nome
      }));
      setExpenses(mapped);
    } catch (err) { setError((err as ApiError).message || 'Erro ao carregar dados.'); }
    finally { setIsLoading(false); }
  }, [selectedMonth, selectedYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja EXCLUIR este gasto?')) return; // Confirmação obrigatória
    setError(''); setSuccess('');
    try {
      await apiService.deleteExpense(id);
      setSuccess('Gasto excluído com sucesso!');
      await fetchData();
    } catch (err) { setError((err as ApiError).message || 'Erro ao excluir.'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const categoryId = categories.find(c => c.name === form.category)?.id;
      const debitedId = debitedSources.find(d => d.name === form.debited)?.id;

      if (!categoryId || !debitedId) throw { message: 'Selecione categoria e conta de débito.' };

      await apiService.createExpense({
        description: form.description,
        value: parseFloat(form.value),
        date: new Date(form.date).toISOString(),
        idCategory: categoryId,
        idDebited: debitedId, // Envia idDebited no POST
        idSubCategory: null
      });
      setSuccess('Gasto cadastrado com sucesso!');
      setForm({ description: '', value: '', date: '', category: '', debited: '' });
      await fetchData();
    } catch (err) { setError((err as ApiError).message || 'Erro ao salvar.'); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gastos</h1>
        <p className="text-gray-600">Gerencie suas despesas</p>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between"><span>{error}</span><button onClick={() => setError('')}>×</button></div>}
      {success && <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex justify-between"><span>{success}</span><button onClick={() => setSuccess('')}>×</button></div>}

      <div className="card p-4 flex gap-4 justify-center">
        <select className="input w-auto" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>{months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select>
        <select className="input w-auto" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <input type="text" className="input" placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
          <input type="number" step="0.01" className="input" placeholder="Valor" value={form.value} onChange={e => setForm({...form, value: e.target.value})} required />
          <input type="date" className="input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
          <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
            <option value="">Categoria</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select className="input" value={form.debited} onChange={e => setForm({...form, debited: e.target.value})} required>
            <option value="">Debitado de...</option>
            {debitedSources.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
          <button type="submit" className="btn btn-primary lg:col-span-5 py-2">Lançar Gasto</button>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
            <tr><th className="px-6 py-3 text-left">Descrição</th><th className="px-6 py-3 text-left">Valor</th><th className="px-6 py-3 text-left">Data</th><th className="px-6 py-3 text-left">Categoria</th><th className="px-6 py-3 text-left">Debitado</th><th className="px-6 py-3 text-left">Ações</th></tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.map(e => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{e.description}</td>
                <td className="px-6 py-4 text-sm text-red-600 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(e.value)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(e.date).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{e.category}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{e.debited}</td>
                <td className="px-6 py-4 text-sm font-medium flex gap-3">
                  <button disabled title="Edição bloqueada" className="text-gray-300 cursor-not-allowed"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(e.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Expenses;