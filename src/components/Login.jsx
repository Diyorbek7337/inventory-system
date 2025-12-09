import React, { useState } from 'react';
import { Package, Lock, User } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password) {
      toast.error('Login va parolni kiriting!');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Tizimga kirish...');

    try {
      const q = query(collection(db, 'users'), where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.update(loadingToast, {
          render: '❌ Login yoki parol noto\'g\'ri!',
          type: 'error',
          isLoading: false,
          autoClose: 3000
        });
        setLoading(false);
        return;
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      if (password === userData.password) {
        toast.update(loadingToast, {
          render: `✅ Xush kelibsiz, ${userData.name}!`,
          type: 'success',
          isLoading: false,
          autoClose: 2000
        });
        setTimeout(() => {
          onLogin({ id: userDoc.id, ...userData });
        }, 500);
      } else {
        toast.update(loadingToast, {
          render: '❌ Login yoki parol noto\'g\'ri!',
          type: 'error',
          isLoading: false,
          autoClose: 3000
        });
      }
    } catch (error) {
      console.error('Login xatosi:', error);
      toast.update(loadingToast, {
        render: '❌ Xatolik yuz berdi. Qayta urinib ko\'ring.',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">CRM Tizimi</h1>
          <p className="text-gray-600">Tizimga kirish</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Login</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Parol</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Kirish...' : 'Kirish'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 font-semibold mb-2">Demo hisob:</p>
          <p className="text-xs text-gray-700">👤 admin / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;