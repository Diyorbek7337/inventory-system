import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Komponentlar
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Income from './components/Income';
import Outcome from './components/Outcome';
import ProductList from './components/ProductList';
import Statistics from './components/Statistics';
import Users from './components/Users';
import Sales from './components/Sales';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Session davomiyligi (30 daqiqa = 1800000 ms)
  const SESSION_TIMEOUT = 15 * 60 * 1000; // 30 daqiqa

  // LocalStorage'dan sessionni yuklash
  useEffect(() => {
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        const now = new Date().getTime();
        
        // Session vaqti tekshirish
        if (now - session.loginTime < SESSION_TIMEOUT) {
          setCurrentUser(session.user);
          // Login vaqtini yangilash (har safar refresh qilganda)
          localStorage.setItem('userSession', JSON.stringify({
            user: session.user,
            loginTime: now
          }));
        } else {
          // Session muddati tugagan
          localStorage.removeItem('userSession');
          toast.info('Sessiya muddati tugadi. Qayta kiring.');
        }
      } catch (error) {
        console.error('Session yuklashda xato:', error);
        localStorage.removeItem('userSession');
      }
    }
    setLoading(false);
  }, []);

  // Auto logout (30 daqiqadan keyin)
  useEffect(() => {
    if (currentUser) {
      const checkSession = setInterval(() => {
        const savedSession = localStorage.getItem('userSession');
        if (savedSession) {
          const session = JSON.parse(savedSession);
          const now = new Date().getTime();
          
          if (now - session.loginTime >= SESSION_TIMEOUT) {
            handleLogout();
            toast.warning('30 daqiqa faoliyat yo\'qligi sababli tizimdan chiqarildingiz.');
          }
        }
      }, 60000); // Har 1 daqiqada tekshirish

      return () => clearInterval(checkSession);
    }
  }, [currentUser]);

  // User activity tracker (har qanday harakatda sessionni yangilash)
  useEffect(() => {
    const updateActivity = () => {
      if (currentUser) {
        const savedSession = localStorage.getItem('userSession');
        if (savedSession) {
          const session = JSON.parse(savedSession);
          localStorage.setItem('userSession', JSON.stringify({
            user: session.user,
            loginTime: new Date().getTime() // Vaqtni yangilash
          }));
        }
      }
    };

    // Mouse, keyboard, scroll harakatlarini kuzatish
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const productsSnap = await getDocs(collection(db, 'products'));
      const productsData = productsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);

      const transSnap = await getDocs(collection(db, 'transactions'));
      const transData = transSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date()
      }));
      setTransactions(transData);

      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);

      const categoriesSnap = await getDocs(collection(db, 'categories'));
      const categoriesData = categoriesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);
    } catch (error) {
      console.error('Ma\'lumotlarni yuklashda xato:', error);
      toast.error('Ma\'lumotlar yuklanmadi!');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    // Session saqlash
    localStorage.setItem('userSession', JSON.stringify({
      user: user,
      loginTime: new Date().getTime()
    }));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('userSession');
    toast.info('Tizimdan chiqildi');
  };

  const addProduct = (newProduct) => {
    setProducts([...products, newProduct]);
  };

  const deleteProduct = (productId) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  const updateProduct = (updatedProduct) => {
    setProducts(products.map(p => 
      p.id === updatedProduct.id ? updatedProduct : p
    ));
  };

  const addTransaction = (newTransaction) => {
    setTransactions([...transactions, newTransaction]);
  };

  const addUser = (newUser) => {
    setUsers([...users, newUser]);
  };

  const deleteUser = (userId) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const addCategory = (newCategory) => {
    setCategories([...categories, newCategory]);
  };

  const deleteCategory = (categoryId) => {
    setCategories(categories.filter(c => c.id !== categoryId));
  };

  // Birinchi loading (session tekshirish)
  if (loading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Login onLogin={handleLogin} />
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          user={currentUser}
          onLogout={handleLogout}
        />

        <div className="flex-1 overflow-y-auto">
          {activeMenu === 'dashboard' && (
            <Dashboard products={products} transactions={transactions} />
          )}

          {activeMenu === 'income' && (
            <Income 
              products={products}
              categories={categories}
              onAddProduct={addProduct}
              onUpdateProduct={updateProduct}
              onAddTransaction={addTransaction}
              onAddCategory={addCategory}
            />
          )}

          {activeMenu === 'outcome' && (
            <Outcome 
              products={products}
              onUpdateProduct={updateProduct}
              onAddTransaction={addTransaction}
            />
          )}

          {activeMenu === 'products' && (
            <ProductList 
              products={products}
              categories={categories}
              onDeleteProduct={deleteProduct}
              onUpdateProduct={updateProduct}
            />
          )}

          {activeMenu === 'sales' && (
            <Sales 
              transactions={transactions}
              products={products}
            />
          )}

          {activeMenu === 'statistics' && (
            <Statistics products={products} transactions={transactions} />
          )}

          {activeMenu === 'users' && (
            <Users 
              users={users} 
              currentUser={currentUser}
              onAddUser={addUser}
              onDeleteUser={deleteUser}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default App;