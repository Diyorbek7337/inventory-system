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

  transactions
    .filter(t => t.type === 'chiqim')
    .forEach(t => {
      if (!sales[t.productId]) {
        // t.productName bo'lmasa products array-dan topishga urinish
        const prod = products.find(p => p.id === t.productId);
        sales[t.productId] = {
          name: t.productName || (prod ? prod.name : 'Nomaʼlum mahsulot'),
          quantity: 0,
          revenue: 0
        };
      }
      sales[t.productId].quantity += t.quantity;
      sales[t.productId].revenue += t.quantity * t.price;
    });

  return Object.values(sales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
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

    const day = (`0${date.getDate()}`).slice(-2);
    const month = (`0${date.getMonth() + 1}`).slice(-2);
    const label = `${day}.${month}`; // 05.12 ko'rinishida

    data.push({
      date: label,
      summa: daySales.reduce((sum, t) => sum + (t.quantity * t.price), 0) / 1
    });
  }
  return data;
};

// Summani formatlash
const formatSum = (value) => {
  if (value >= 1000000) {
    const mln = Math.floor(value / 1000000);
    const rest = value % 1000000;

    // faqat to‘liq million bo‘lsa
    if (rest === 0) {
      return `${mln} mln so'm`;
    }

    // million + qoldiq bo‘lsa
    return `${mln} ${rest.toLocaleString()} so'm`;
  }

  // 1 mln dan kichik summalar
  return `${value.toLocaleString()} so'm`;
};

  const stats = getStats();
  const topProducts = getTopProducts();
  const dailySales = getDailySales();

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="p-6 text-white rounded-lg shadow bg-gradient-to-br from-blue-500 to-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100">Jami Mahsulotlar</p>
              <p className="mt-1 text-3xl font-bold">{products.length}</p>
            </div>
            <Package className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="p-6 text-white rounded-lg shadow bg-gradient-to-br from-green-500 to-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-100">Bugungi Savdo</p>
              <p className="mt-1 text-3xl font-bold">
  {formatSum(stats.todaySales)}
</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="p-6 text-white rounded-lg shadow bg-gradient-to-br from-purple-500 to-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-100">Sotilgan Dona</p>
              <p className="mt-1 text-3xl font-bold">{stats.todayItems}</p>
            </div>
            <ShoppingCart className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        <div className="p-6 text-white rounded-lg shadow bg-gradient-to-br from-red-500 to-red-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-100">Jami Qarz</p>
              <p className="mt-1 text-3xl font-bold">
  {formatSum(stats.totalDebt)}
</p>

            </div>
            <DollarSign className="w-12 h-12 text-red-200" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Savdo grafigi */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-bold text-gray-800">Oxirgi 7 kunlik savdo (mln so'm)</h3>
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
       <div className="p-6 bg-white rounded-lg shadow">
  <h3 className="mb-4 text-lg font-bold text-gray-800">Top 10 mahsulotlar</h3>
  <div className="space-y-2">
    {topProducts.length === 0 ? (
      <p className="text-sm text-gray-500">Hozircha sotuvlar mavjud emas.</p>
    ) : (
      topProducts.map((p, idx) => (
        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 font-bold text-white bg-blue-600 rounded-full">
              {idx + 1}
            </span>
            <div>
              <div className="font-medium text-gray-800">{p.name}</div>
              <div className="text-sm text-gray-500">{p.quantity} dona sotildi</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-green-600">
  {formatSum(p.revenue)}
</div>

            <div className="text-sm text-gray-500">{p.revenue.toLocaleString()} so'm</div>
          </div>
        </div>
      ))
    )}
  </div>
</div>
      </div>

      {/* Top mahsulotlar jadvali */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="mb-4 text-lg font-bold text-gray-800">Batafsil ma'lumot</h3>
        <div className="space-y-2">
          {topProducts.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 font-bold text-white bg-blue-600 rounded-full">
                  {i + 1}
                </span>
                <span className="font-medium text-gray-800">{p.name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{p.quantity} dona sotildi</p>
                <p className="font-bold text-green-600">
  {formatSum(p.revenue)}
</p>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;