import React, { useState } from 'react';
import { User, Plus, Trash2, Shield } from 'lucide-react';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const Users = ({ users, currentUser, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'user' });

  const addUser = async () => {
    if (!newUser.username.trim() || !newUser.password || !newUser.name.trim()) {
      alert('Barcha maydonlarni to\'ldiring!');
      return;
    }

    if (newUser.password.length < 6) {
      alert('Parol kamida 6 belgidan iborat bo\'lishi kerak!');
      return;
    }

    // Username unikal ekanligini tekshirish
    if (users.some(u => u.username === newUser.username.trim())) {
      alert('Bu login band!');
      return;
    }

    try {
      await addDoc(collection(db, 'users'), {
        username: newUser.username.trim(),
        password: newUser.password,
        name: newUser.name.trim(),
        role: newUser.role,
        createdAt: new Date()
      });

      setNewUser({ username: '', password: '', name: '', role: 'user' });
      setShowModal(false);
      onUpdate();
      alert('Foydalanuvchi qo\'shildi!');
    } catch (error) {
      console.error('Xato:', error);
      alert('Xatolik yuz berdi!');
    }
  };

  const deleteUser = async (userId) => {
    if (userId === currentUser.id) {
      alert('O\'zingizni o\'chira olmaysiz!');
      return;
    }

    if (window.confirm('Foydalanuvchini o\'chirmoqchimisiz?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        onUpdate();
        alert('O\'chirildi!');
      } catch (error) {
        console.error('Xato:', error);
        alert('Xatolik yuz berdi!');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Foydalanuvchilar</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Yangi foydalanuvchi
        </button>
      </div>

      {/* Foydalanuvchilar ro'yxati */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => (
          <div
            key={user.id}
            className={`bg-white rounded-lg shadow p-6 border-2 ${
              user.id === currentUser.id ? 'border-blue-500' : 'border-transparent'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                user.role === 'admin' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                {user.role === 'admin' ? (
                  <Shield className={`w-8 h-8 ${user.role === 'admin' ? 'text-red-600' : 'text-blue-600'}`} />
                ) : (
                  <User className="w-8 h-8 text-blue-600" />
                )}
              </div>
              {user.id !== currentUser.id && (
                <button
                  onClick={() => deleteUser(user.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <h3 className="font-bold text-xl text-gray-800 mb-2">{user.name}</h3>
            <p className="text-gray-600 font-mono mb-2">@{user.username}</p>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                user.role === 'admin' 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {user.role === 'admin' ? 'Administrator' : 'Foydalanuvchi'}
              </span>
              {user.id === currentUser.id && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  Siz
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Qo'shilgan: {new Date(
    user.createdAt?.seconds
      ? user.createdAt.seconds * 1000
      : user.createdAt
  ).toLocaleDateString('uz-UZ')}
            </p>
          </div>
        ))}
      </div>

      {/* Yangi foydalanuvchi modali */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Yangi foydalanuvchi</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To'liq ism *
                </label>
                <input
                  type="text"
                  placeholder="Ism Familiya"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Login *
                </label>
                <input
                  type="text"
                  placeholder="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parol *
                </label>
                <input
                  type="password"
                  placeholder="Kamida 6 ta belgi"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">Foydalanuvchi</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <p className="font-semibold mb-1">⚠️ Eslatma:</p>
                <p>Administrator barcha funksiyalarga kirish huquqiga ega.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewUser({ username: '', password: '', name: '', role: 'user' });
                }}
                className="flex-1 bg-gray-200 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-300 font-medium"
              >
                Bekor qilish
              </button>
              <button
                onClick={addUser}
                className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 font-medium"
              >
                Qo'shish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;