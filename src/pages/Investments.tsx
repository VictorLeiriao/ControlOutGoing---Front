import React, { useState, useEffect, useCallback } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import apiService, { ApiError, InvestmentType, Investment } from '../services/ApiService';

interface InvestmentEntry {
  id: number;
  description: string;
  value: number;
  date: string;
  investmentType: string;
}

const Investments: React.FC = () => {
  const [form, setForm] = useState({ id: 0, description: '', value: '', date: '', investmentType: '' });
  const [investments, setInvestments] = useState<InvestmentEntry[]>([]);
  const [types, setTypes] = useState<InvestmentType[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const [typeResp, invResp] = await Promise.all([
        apiService.getInvestmentTypes(),
        apiService.getInvestments()
      ]);
      setTypes(typeResp.value);

      const mapped = invResp.value.map(i => ({
        id: i.id,
        description: i.description,
        value: i.value,
        date: i.date,
        investmentType: typeResp.value.find(t => t.id === i.idInvestimentType)?.description || 'Outros'
      }));
      setInvestments(mapped);
    } catch (err) { setError((err as ApiError).message || 'Erro ao carregar dados.'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja EXCLUIR este investimento?')) return;
    setError(''); setSuccess('');
    try {
      await apiService.deleteInvestment(id);
      setSuccess('Investimento excluído com sucesso!');
      await fetchData();
    } catch (err) { setError((err as ApiError).message || 'Erro ao excluir.'); }
  };

  const handleEdit = (item: InvestmentEntry) => {
    const typeId = types.find(t => t.description === item.investmentType)?.description || '';
    setForm({
      id: item.id,
      description: item.description,
      value: item.value.toString(),
      date: item.date.split('T')[0],
      investmentType: typeId
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const typeId = types.find(t => t.description === form.investmentType)?.id;
      if (!typeId) throw { message: 'Selecione um tipo de investimento.' };

      const payload = {
        description: form.description,
        value: parseFloat(form.value),
        date: new Date(form.date).toISOString(),
        idInvestmentType: typeId
      };

      if (form.id > 0) {
        await apiService.updateInvestment(form.id, payload);
        setSuccess('Investimento atualizado com sucesso!');
      } else {
        await apiService.createInvestment(payload);
        setSuccess('Investimento lançado com sucesso!');
      }

      setForm({ id: 0, description: '', value: '', date: '', investmentType: '' });
      await fetchData();
    } catch (err) { setError((err as ApiError).message || 'Erro ao salvar.'); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lançamento de Investimentos</h1>
        <p className="text-gray-600">Registre suas aplicações financeiras</p>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between"><span>{error}</span><button onClick={() => setError('')}>×</button></div>}
      {success && <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex justify-between"><span>{success}</span><button onClick={() => setSuccess('')}>×</button></div>}

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input type="text" className="input" placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
          <input type="number" step="0.01" className="input" placeholder="Valor" value={form.value} onChange={e => setForm({...form, value: e.target.value})} required />
          <input type="date" className="input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
          <select className="input" value={form.investmentType} onChange={e => setForm({...form, investmentType: e.target.value})} required>
            <option value="">Tipo de Investimento</option>
            {types.map(t => <option key={t.id} value={t.description}>{t.description}</option>)}
          </select>
          <div className="lg:col-span-4 flex gap-2">
             <button type="submit" className="btn btn-primary flex-1 py-2">{form.id > 0 ? 'Atualizar' : 'Lançar'} Investimento</button>
             {form.id > 0 && <button type="button" onClick={() => setForm({id: 0, description: '', value: '', date: '', investmentType: ''})} className="btn bg-gray-200 text-gray-700 px-6">Cancelar</button>}
          </div>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
            <tr><th className="px-6 py-3 text-left">Descrição</th><th className="px-6 py-3 text-left">Valor</th><th className="px-6 py-3 text-left">Data</th><th className="px-6 py-3 text-left">Tipo</th><th className="px-6 py-3 text-left">Ações</th></tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {investments.map(i => (
              <tr key={i.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{i.description}</td>
                <td className="px-6 py-4 text-sm text-blue-600 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(i.value)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(i.date).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{i.investmentType}</td>
                <td className="px-6 py-4 text-sm font-medium flex gap-3">
                  <button onClick={() => handleEdit(i)} className="text-blue-600"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(i.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Investments;