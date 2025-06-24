import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const Dashboard: React.FC = () => {
  // Dados de exemplo para o gráfico
  const expenseData = [
    { name: 'Alimentação', value: 1200, color: '#3b82f6' },
    { name: 'Transporte', value: 800, color: '#10b981' },
    { name: 'Moradia', value: 1000, color: '#f59e0b' },
    { name: 'Lazer', value: 500, color: '#ef4444' },
  ];

  const summaryCards = [
    {
      title: 'Renda Mensal',
      value: 'R$ 5.000,00',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      title: 'Gasto Mensal',
      value: 'R$ 3.500,00',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      borderColor: 'border-red-200'
    },
    {
      title: 'Saldo Atual',
      value: 'R$ 1.500,00',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Gastos</h1>
        <p className="text-gray-600">Visão geral das suas finanças pessoais</p>
      </div>

      {/* Gráfico de Pizza */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          Gastos por Categoria
        </h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`R$ ${value}`, 'Valor']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryCards.map((card, index) => (
          <div
            key={index}
            className={`card p-6 border-l-4 ${card.borderColor} ${card.bgColor}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {card.title}
                </p>
                <p className={`text-2xl font-bold ${card.textColor}`}>
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;