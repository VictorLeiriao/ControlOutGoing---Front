import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import apiService, { InvestmentType } from '../services/ApiService';

const InvestmentTypes: React.FC = () => {
  const [types, setTypes] = useState<InvestmentType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ id: 0, description: '', value: 0 });

  const load = async () => { const res = await apiService.getInvestmentTypes(); setTypes(res.value); };
  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.id > 0) await apiService.updateInvestmentType(form.id, form);
    else await apiService.createInvestmentType(form);
    setIsModalOpen(false); setForm({ id: 0, description: '', value: 0 }); load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tipos de Investimento</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary flex items-center gap-2"><Plus size={18}/> Novo</button>
      </div>
      <div className="card shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr><th className="p-4">Descrição</th><th className="p-4">Meta</th><th className="p-4 text-right">Ações</th></tr>
          </thead>
          <tbody>
            {types.map(t => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{t.description}</td>
                <td className="p-4">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.value)}</td>
                <td className="p-4 text-right">
                  <button className="text-blue-600 mr-2" onClick={() => { setForm(t); setIsModalOpen(true); }}><Pencil size={18}/></button>
                  <button className="text-red-600" onClick={async () => { if(confirm('Excluir?')) { await apiService.deleteInvestmentType(t.id); load(); } }}><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl w-full max-w-md space-y-4 shadow-xl">
            <h2 className="text-xl font-bold">{form.id > 0 ? 'Editar' : 'Novo'} Tipo</h2>
            <input className="input w-full" placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
            <input className="input w-full" type="number" placeholder="Valor Meta" value={form.value} onChange={e => setForm({...form, value: Number(e.target.value)})} required />
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500">Cancelar</button>
              <button className="btn btn-primary px-6 py-2">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default InvestmentTypes;