import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// Komponentlar
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Income from './components/Income';
import Outcome from './components/Outcome';
import ProductList from './components/Productlist';
import Statistics from './components/Statistics';
import Users from './components/Users';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ma'lumotlarni yuklash
  const loadData = async () => {
    setLoading(true);
    try {
      // Mahsulotlar
      const productsSnap = await getDocs(collection(db, 'products'));
      const productsData = productsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);

      // Tranzaksiyalar
      const transSnap = await getDocs(collection(db, 'transactions'));
      const transData = transSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date()
      }));
      setTransactions(transData);

      // Foydalanuvchilar
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Ma\'lumotlarni yuklashda xato:', error);
    }
    setLoading(false);
  };

  // Login qilgandan keyin ma'lumotlarni yuklash
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  // Login qilinmagan bo'lsa
  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  // Loading holatida
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // Asosiy interfeys
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        user={currentUser}
        onLogout={() => setCurrentUser(null)}
      />

      {/* Asosiy kontent */}
      <div className="flex-1 overflow-y-auto">
        {activeMenu === 'dashboard' && (
          <Dashboard products={products} transactions={transactions} />
        )}

        {activeMenu === 'income' && (
          <Income products={products} onUpdate={loadData} />
        )}

        {activeMenu === 'outcome' && (
          <Outcome products={products} onUpdate={loadData} />
        )}

        {activeMenu === 'products' && (
          <ProductList products={products} onUpdate={loadData} />
        )}

        {activeMenu === 'statistics' && (
          <Statistics products={products} transactions={transactions} />
        )}

        {activeMenu === 'users' && (
          <Users users={users} currentUser={currentUser} onUpdate={loadData} />
        )}
      </div>
    </div>
  );
}

export default App;