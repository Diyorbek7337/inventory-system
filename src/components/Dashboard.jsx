import React from 'react';
import { Package, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = ({ products, transactions }) => {
  const getStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = transactions
      .filter(t => t.type === 'chiqim' && new Date(t.date) >= today)
      .reduce((sum, t) => sum + (t.quantity * t.price), 0);

    const todayItems = transactions
      .filter(t => t.type === 'chiqim' && new Date(t.date) >= today)
      .reduce((sum, t) => sum + t.quantity, 0);

    const totalDebt = transactions
      .filter(t => t.type === 'chiqim' && t.debt > 0)
      .reduce((sum, t) => sum + t.debt, 0);

    return { todaySales, todayItems, totalDebt };
  };

  const getTopProducts = () => {
    const sales = {};
    transactions.filter(t => t.type === 'chiqim').forEach(t => {
      if (!sales[t.productId]) {
        sales[t.productId] = { name: t.productName, quantity: 0, revenue: 0 };
      }
      sales[t.productId].quantity += t.quantity;
      sales[t.productId].revenue += t.quantity * t.price;
    });
    return Object.values(sales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  };

  const getDailySales = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const daySales = transactions.filter(t => {
        const tDate = new Date(t.date);
        tDate.setHours(0, 0, 0, 0);
        return t.type === 'chiqim' && tDate.getTime() === date.getTime();
      });
      
      data.push({
        date: date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' }),
        summa: daySales.reduce((sum, t) => sum + (t.quantity * t.price), 0) / 1000000
      });
    }
    return data;
  };

  const stats = getStats();
  const topProducts = getTopProducts();
  const dailySales = getDailySales();

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-blue-100 text-sm">Jami Mahsulotlar</p>
              <p className="text-3xl font-bold mt-1">{products.length}</p>
            </div>
            <Package className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-green-100 text-sm">Bugungi Savdo</p>
              <p className="text-3xl font-bold mt-1">{(stats.todaySales / 1000000).toFixed(1)}M</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-purple-100 text-sm">Sotilgan Dona</p>
              <p className="text-3xl font-bold mt-1">{stats.todayItems}</p>
            </div>
            <ShoppingCart className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-red-100 text-sm">Jami Qarz</p>
              <p className="text-3xl font-bold mt-1">{(stats.totalDebt / 1000000).toFixed(1)}M</p>
            </div>
            <DollarSign className="w-12 h-12 text-red-200" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Savdo grafigi */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Oxirgi 7 kunlik savdo (mln so'm)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="summa" stroke="#3b82f6" strokeWidth={2} name="Savdo" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top mahsulotlar */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top 10 mahsulotlar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantity" fill="#10b981" name="Soni" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top mahsulotlar jadvali */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Batafsil ma'lumot</h3>
        <div className="space-y-2">
          {topProducts.map((p, i) => (
            <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <span className="font-medium text-gray-800">{p.name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{p.quantity} dona sotildi</p>
                <p className="font-bold text-green-600">{(p.revenue / 1000000).toFixed(2)} mln so'm</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;