import React, { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';

interface ExpenseEntry {
  id: number;
  description: string;
  value: number;
  date: string;
  category: string;
  subcategory: string;
}

const Expenses: React.FC = () => {
  const [form, setForm] = useState({
    description: '',
    value: '',
    date: '',
    category: '',
    subcategory: ''
  });

  const [expenses, setExpenses] = useState<ExpenseEntry[]>([
    { 
      id: 1, 
      description: 'Supermercado', 
      value: 350, 
      date: '2024-01-02', 
      category: 'Alimentação', 
      subcategory: 'Compras' 
    },
    { 
      id: 2, 
      description: 'Combustível', 
      value: 200, 
      date: '2024-01-05', 
      category: 'Transporte', 
      subcategory: 'Combustível' 
    },
    { 
      id: 3, 
      description: 'Aluguel', 
      value: 1000, 
      date: '2024-01-01', 
      category: 'Moradia', 
      subcategory: 'Aluguel' 
    }
  ]);

  const categories = [
    { 
      id: 1, 
      name: 'Alimentação',
      subcategories: ['Compras', 'Restaurantes', 'Delivery']
    },
    { 
      id: 2, 
      name: 'Transporte',
      subcategories: ['Combustível', 'Transporte Público', 'Manutenção']
    },
    { 
      id: 3, 
      name: 'Moradia',
      subcategories: ['Aluguel', 'Condomínio', 'Utilities']
    },
    { 
      id: 4, 
      name: 'Lazer',
      subcategories: ['Cinema', 'Viagens', 'Hobbies']
    }
  ];

  const getSubcategories = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.subcategories : [];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.description && form.value && form.date && form.category && form.subcategory) {
      const newExpense: ExpenseEntry = {
        id: Date.now(),
        description: form.description,
        value: parseFloat(form.value),
        date: form.date,
        category: form.category,
        subcategory: form.subcategory
      };
      setExpenses([...expenses, newExpense]);
      setForm({ description: '', value: '', date: '', category: '', subcategory: '' });
    }
  };

  const handleDelete = (id: number) => {
    setExpenses(expenses.filter(item => item.id !== id));
  };

  const handleCategoryChange = (category: string) => {
    setForm({ ...form, category, subcategory: '' });
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lançar Gasto</h1>
        <p className="text-gray-600">Registre seus gastos e despesas</p>
      </div>

      {/* Formulário */}
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição do Gasto
              </label>
              <input
                type="text"
                id="description"
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
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
                Data do Gasto
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
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                id="category"
                className="input"
                value={form.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
                Subcategoria
              </label>
              <select
                id="subcategory"
                className="input"
                value={form.subcategory}
                onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                required
                disabled={!form.category}
              >
                <option value="">Selecione uma subcategoria</option>
                {getSubcategories(form.category).map((subcategory) => (
                  <option key={subcategory} value={subcategory}>
                    {subcategory}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary px-6 py-2">
              Lançar Gasto
            </button>
          </div>
        </form>
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Gastos Lançados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subcategoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {expense.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                    {formatCurrency(expense.value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(expense.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {expense.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {expense.subcategory}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button className="text-primary-600 hover:text-primary-900 transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(expense.id)}
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

export default Expenses;