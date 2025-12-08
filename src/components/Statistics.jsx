import React, { useState } from 'react';
import { Calendar, TrendingUp, Users, DollarSign } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Statistics = ({ products, transactions }) => {
  const [periodFilter, setPeriodFilter] = useState('oy'); // kun, hafta, oy, yil

  const getFilteredTransactions = () => {
    const now = new Date();
    let startDate = new Date();

    switch (periodFilter) {
      case 'kun':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'hafta':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'oy':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'yil':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        break;
    }

    return transactions.filter(t => new Date(t.date) >= startDate);
  };

  const getStatistics = () => {
    const filtered = getFilteredTransactions();
    
    const income = filtered
      .filter(t => t.type === 'kirim')
      .reduce((sum, t) => sum + (t.quantity * t.price), 0);

    const outcome = filtered
      .filter(t => t.type === 'chiqim')
      .reduce((sum, t) => sum + (t.paidAmount || (t.quantity * t.price)), 0);

    const debt = filtered
      .filter(t => t.type === 'chiqim')
      .reduce((sum, t) => sum + (t.debt || 0), 0);

    const profit = outcome - income;

    const uniqueCustomers = new Set(
      filtered.filter(t => t.type === 'chiqim' && t.customerName && t.customerName !== 'Naqd')
        .map(t => t.customerName)
    ).size;

    return { income, outcome, debt, profit, uniqueCustomers };
  };

  const getCategoryData = () => {
    const categoryStats = {};
    
    getFilteredTransactions()
      .filter(t => t.type === 'chiqim')
      .forEach(t => {
        const product = products.find(p => p.id === t.productId);
        if (product) {
          const category = product.category;
          if (!categoryStats[category]) {
            categoryStats[category] = 0;
          }
          categoryStats[category] += t.quantity * t.price;
        }
      });

    return Object.entries(categoryStats).map(([name, value]) => ({
      name,
      value: value / 1000000
    }));
  };

  const getMonthlyData = () => {
    const monthlyStats = {};

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('uz-UZ', { month: 'short', year: 'numeric' });
      monthlyStats[monthKey] = { income: 0, outcome: 0 };
    }

    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = date.toLocaleDateString('uz-UZ', { month: 'short', year: 'numeric' });
      
      if (monthlyStats[monthKey]) {
        if (t.type === 'kirim') {
          monthlyStats[monthKey].income += t.quantity * t.price;
        } else {
          monthlyStats[monthKey].outcome += t.paidAmount || (t.quantity * t.price);
        }
      }
    });

    return Object.entries(monthlyStats).map(([month, data]) => ({
      month,
      kirim: data.income / 1000000,
      chiqim: data.outcome / 1000000
    }));
  };

  const getDebtors = () => {
    const debtors = {};

    transactions
      .filter(t => t.type === 'chiqim' && t.debt > 0)
      .forEach(t => {
        if (!debtors[t.customerName]) {
          debtors[t.customerName] = 0;
        }
        debtors[t.customerName] += t.debt;
      });

    return Object.entries(debtors)
      .map(([name, debt]) => ({ name, debt }))
      .sort((a, b) => b.debt - a.debt)
      .slice(0, 10);
  };

  const stats = getStatistics();
  const categoryData = getCategoryData();
  const monthlyData = getMonthlyData();
  const debtors = getDebtors();

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="p-6 space-y-6">
      {/* Davr tanlash */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-bold text-gray-800">Davr tanlash:</h3>
        </div>
        <div className="flex gap-2">
          {[
            { key: 'kun', label: 'Bugun' },
            { key: 'hafta', label: 'Hafta' },
            { key: 'oy', label: 'Oy' },
            { key: 'yil', label: 'Yil' }
          ].map(period => (
            <button
              key={period.key}
              onClick={() => setPeriodFilter(period.key)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                periodFilter === period.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Statistika kartalari */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-green-100 text-sm">Kirim</p>
              <p className="text-3xl font-bold mt-1">{(stats.income / 1000000).toFixed(1)}M</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-blue-100 text-sm">Chiqim (Savdo)</p>
              <p className="text-3xl font-bold mt-1">{(stats.outcome / 1000000).toFixed(1)}M</p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-purple-100 text-sm">Foyda</p>
              <p className="text-3xl font-bold mt-1">{(stats.profit / 1000000).toFixed(1)}M</p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-red-100 text-sm">Qarz</p>
              <p className="text-3xl font-bold mt-1">{(stats.debt / 1000000).toFixed(1)}M</p>
            </div>
            <Users className="w-12 h-12 text-red-200" />
          </div>
        </div>
      </div>

      {/* Grafiklar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Oylik statistika */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">12 oylik statistika (mln so'm)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="kirim" fill="#10b981" name="Kirim" />
              <Bar dataKey="chiqim" fill="#3b82f6" name="Chiqim" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Kategoriya bo'yicha */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Kategoriya bo'yicha savdo (mln so'm)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value.toFixed(1)}M`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Qarzdorlar ro'yxati */}
      {debtors.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Qarzdorlar ro'yxati</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mijoz</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qarz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {debtors.map((debtor, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {debtor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                      {debtor.debt.toLocaleString()} so'm
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;