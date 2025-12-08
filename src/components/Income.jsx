import React, { useState } from 'react';
import { PackagePlus, Search, Barcode } from 'lucide-react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const Income = ({ products, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    barcode: '',
    quantity: ''
  });

  const categories = ['Elektronika', 'Kiyim', 'Kitoblar', 'Oziq-ovqat', 'Uy-ro\'zg\'or', 'Sport'];

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.includes(searchTerm)
  );

  const addToCart = (product) => {
    const existing = selectedItems.find(item => item.id === product.id);
    if (existing) {
      setSelectedItems(selectedItems.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setSelectedItems([...selectedItems, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      setSelectedItems(selectedItems.filter(item => item.id !== id));
    } else {
      setSelectedItems(selectedItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      alert('Mahsulot tanlang!');
      return;
    }

    try {
      for (const item of selectedItems) {
        const product = products.find(p => p.id === item.id);
        await updateDoc(doc(db, 'products', item.id), {
          quantity: product.quantity + item.quantity
        });

        await addDoc(collection(db, 'transactions'), {
          productId: item.id,
          productName: item.name,
          type: 'kirim',
          quantity: item.quantity,
          price: item.price,
          date: new Date()
        });
      }

      setSelectedItems([]);
      onUpdate();
      alert('Kirim qilindi!');
    } catch (error) {
      console.error('Xato:', error);
      alert('Xatolik yuz berdi!');
    }
  };

  const addNewProduct = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.price) {
      alert('Majburiy maydonlarni to\'ldiring!');
      return;
    }

    try {
      await addDoc(collection(db, 'products'), {
        name: newProduct.name,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        barcode: newProduct.barcode,
        quantity: parseInt(newProduct.quantity) || 0,
        createdAt: new Date()
      });

      setNewProduct({ name: '', category: '', price: '', barcode: '', quantity: '' });
      setShowAddProduct(false);
      onUpdate();
      alert('Mahsulot qo\'shildi!');
    } catch (error) {
      console.error('Xato:', error);
      alert('Xatolik yuz berdi!');
    }
  };

  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Kirim qilish</h2>
        <button
          onClick={() => setShowAddProduct(!showAddProduct)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PackagePlus className="w-5 h-5" />
          Yangi mahsulot
        </button>
      </div>

      {/* Yangi mahsulot qo'shish */}
      {showAddProduct && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-blue-900 mb-3">Yangi mahsulot qo'shish</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Mahsulot nomi *"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="border rounded-lg px-4 py-2"
            />
            <select
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              className="border rounded-lg px-4 py-2"
            >
              <option value="">Kategoriya *</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input
              type="number"
              placeholder="Narxi *"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              className="border rounded-lg px-4 py-2"
            />
            <input
              type="text"
              placeholder="Barcode"
              value={newProduct.barcode}
              onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
              className="border rounded-lg px-4 py-2"
            />
            <input
              type="number"
              placeholder="Boshlang'ich miqdor"
              value={newProduct.quantity}
              onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
              className="border rounded-lg px-4 py-2"
            />
            <button
              onClick={addNewProduct}
              className="bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-700"
            >
              Qo'shish
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mahsulotlar ro'yxati */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Mahsulot nomi yoki barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Mahsulot topilmadi</p>
            ) : (
              filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="flex justify-between items-center p-4 border rounded-lg hover:bg-blue-50 cursor-pointer transition"
                >
                  <div>
                    <p className="font-medium text-gray-800">{product.name}</p>
                    <div className="flex gap-2 text-sm text-gray-500">
                      <span>{product.category}</span>
                      {product.barcode && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{product.barcode}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{product.price?.toLocaleString()} so'm</p>
                    <p className="text-sm text-gray-500">Omborda: {product.quantity}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Savat */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Tanlangan mahsulotlar</h3>
          
          <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
            {selectedItems.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">Bo'sh</p>
            ) : (
              selectedItems.map(item => (
                <div key={item.id} className="border rounded-lg p-3">
                  <p className="font-medium text-sm text-gray-800 mb-2">{item.name}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center border rounded px-2 py-1"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm font-bold text-gray-800">
                      {(item.quantity * item.price).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-lg font-bold">
              <span>Jami:</span>
              <span className="text-blue-600">{totalAmount.toLocaleString()} so'm</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={selectedItems.length === 0}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Kirim qilish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Income;