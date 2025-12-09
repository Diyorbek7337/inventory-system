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
  const [dataLoaded, setDataLoaded] = useState(false);

  const SESSION_TIMEOUT = 30 * 60 * 1000;

  // Session yuklash
  useEffect(() => {
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        const now = new Date().getTime();
        
        if (now - session.loginTime < SESSION_TIMEOUT) {
          setCurrentUser(session.user);
          localStorage.setItem('userSession', JSON.stringify({
            user: session.user,
            loginTime: now
          }));
        } else {
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

  // Auto logout
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
      }, 60000);

      return () => clearInterval(checkSession);
    }
  }, [currentUser]);

  // Activity tracker
  useEffect(() => {
    const updateActivity = () => {
      if (currentUser) {
        const savedSession = localStorage.getItem('userSession');
        if (savedSession) {
          const session = JSON.parse(savedSession);
          localStorage.setItem('userSession', JSON.stringify({
            user: session.user,
            loginTime: new Date().getTime()
          }));
        }
      }
    };

    const throttledUpdate = throttle(updateActivity, 5000); // Har 5 sekundda 1 marta

    window.addEventListener('mousemove', throttledUpdate);
    window.addEventListener('keypress', throttledUpdate);
    window.addEventListener('click', throttledUpdate);

    return () => {
      window.removeEventListener('mousemove', throttledUpdate);
      window.removeEventListener('keypress', throttledUpdate);
      window.removeEventListener('click', throttledUpdate);
    };
  }, [currentUser]);

   const loadData = async () => {
    try {
      // Parallel yuklash (tezroq)
      const [productsSnap, transSnap, usersSnap, categoriesSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'transactions')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'categories'))
      ]);

      const productsData = productsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);

      const transData = transSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date()
      }));
      setTransactions(transData);

      const usersData = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);

      const categoriesData = categoriesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);

      setDataLoaded(true);
    } catch (error) {
      console.error('Ma\'lumotlarni yuklashda xato:', error);
      toast.error('Ma\'lumotlar yuklanmadi!');
    }
  };
  // FAQAT bir marta ma'lumotlarni yuklash
  useEffect(() => {
    if (currentUser && !dataLoaded) {
      loadData();
    }
  }, [currentUser]);

 

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('userSession', JSON.stringify({
      user: user,
      loginTime: new Date().getTime()
    }));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setDataLoaded(false);
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

  if (loading && !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
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
          autoClose={3000}
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

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
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
          {!dataLoaded ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
                <p className="text-gray-600">Ma'lumotlar yuklanmoqda...</p>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </>
  );
}

// Throttle funksiyasi (tez-tez chaqirilishini cheklash)
function throttle(func, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = new Date().getTime();
    if (now - lastCall < delay) return;
    lastCall = now;
    return func(...args);
  };
}

export default App;