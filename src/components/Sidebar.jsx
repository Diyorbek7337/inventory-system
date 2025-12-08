import React from 'react';
import { Home, PackagePlus, PackageMinus, Package, BarChart3, Users, LogOut } from 'lucide-react';

const Sidebar = ({ activeMenu, setActiveMenu, user, onLogout }) => {
  const menuItems = [
    { key: 'dashboard', label: 'Asosiy', icon: Home },
    { key: 'income', label: 'Kirim', icon: PackagePlus },
    { key: 'outcome', label: 'Chiqim', icon: PackageMinus },
    { key: 'products', label: 'Mahsulotlar', icon: Package },
    { key: 'statistics', label: 'Statistika', icon: BarChart3 },
    { key: 'users', label: 'Foydalanuvchilar', icon: Users },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">CRM Tizimi</h1>
        <p className="text-sm text-gray-400 mt-1">{user.name}</p>
      </div>

      <nav className="flex-1 py-4">
        {menuItems.map(item => (
          <button
            key={item.key}
            onClick={() => setActiveMenu(item.key)}
            className={`w-full flex items-center gap-3 px-6 py-3 hover:bg-gray-800 transition-colors ${
              activeMenu === item.key ? 'bg-blue-600 hover:bg-blue-700' : ''
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button
        onClick={onLogout}
        className="flex items-center gap-3 px-6 py-3 hover:bg-red-600 transition-colors border-t border-gray-800"
      >
        <LogOut className="w-5 h-5" />
        <span>Chiqish</span>
      </button>
    </div>
  );
};

export default Sidebar;