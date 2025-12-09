import React, { useState } from 'react';
import { PackagePlus, Search, FolderPlus, Trash2, Camera, Scan } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';
import BarcodeScanner from './BarcodeScanner';

const Income = ({ products, categories, onAddProduct, onUpdateProduct, onAddTransaction, onAddCategory, onDeleteCategory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    barcode: '',
    quantity: ''
  });
  const [newCategory, setNewCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.includes(searchTerm)
  );

  // Barcode scan qilganda
  const handleBarcodeScan = (barcode) => {
    setSearchTerm(barcode);
    
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      addToCart(product);
      toast.success(`${product.name} topildi va savatga qo'shildi!`);
    } else {
      toast.warning(`Barcode: ${barcode} - Mahsulot topilmadi!`);
    }
  };

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
      toast.warning('Mahsulot tanlang!');
      return;
    }

    setSaving(true);
    const loadingToast = toast.loading('Kirim qilinmoqda...');

    try {
      for (const item of selectedItems) {
        const product = products.find(p => p.id === item.id);
        const newQuantity = product.quantity + item.quantity;

        await updateDoc(doc(db, 'products', item.id), {
          quantity: newQuantity
        });

        onUpdateProduct({ ...product, quantity: newQuantity });

        const transactionData = {
          productId: item.id,
          productName: item.name,
          type: 'kirim',
          quantity: item.quantity,
          price: item.price,
          date: new Date()
        };

        const docRef = await addDoc(collection(db, 'transactions'), transactionData);
        onAddTransaction({ id: docRef.id, ...transactionData });
      }

      setSelectedItems([]);
      toast.update(loadingToast, {
        render: '✅ Kirim muvaffaqiyatli qilindi!',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (error) {
      console.error('Xato:', error);
      toast.update(loadingToast, {
        render: '❌ Xatolik yuz berdi!',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
    }
    setSaving(false);
  };

  const addNewProduct = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.price) {
      toast.error('Majburiy maydonlarni to\'ldiring!');
      return;
    }

    setSaving(true);
    const loadingToast = toast.loading('Mahsulot qo\'shilmoqda...');

    try {
      const productData = {
        name: newProduct.name,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        barcode: newProduct.barcode,
        quantity: parseInt(newProduct.quantity) || 0,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'products'), productData);
      onAddProduct({ id: docRef.id, ...productData });

      setNewProduct({ name: '', category: '', price: '', barcode: '', quantity: '' });
      setShowAddProduct(false);
      
      toast.update(loadingToast, {
        render: '✅ Mahsulot qo\'shildi!',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (error) {
      console.error('Xato:', error);
      toast.update(loadingToast, {
        render: '❌ Xatolik yuz berdi!',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
    }
    setSaving(false);
  };

  const addNewCategory = async () => {
    if (!newCategory.trim()) {
      toast.error('Kategoriya nomini kiriting!');
      return;
    }

    if (categories.some(c => c.name.toLowerCase() === newCategory.trim().toLowerCase())) {
      toast.error('Bu kategoriya allaqachon mavjud!');
      return;
    }

    setSaving(true);
    try {
      const categoryData = {
        name: newCategory.trim(),
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'categories'), categoryData);
      onAddCategory({ id: docRef.id, ...categoryData });

      setNewCategory('');
      toast.success('✅ Kategoriya qo\'shildi!');
    } catch (error) {
      console.error('Xato:', error);
      toast.error('❌ Xatolik yuz berdi!');
    }
    setSaving(false);
  };

  const removeCategoryHandler = async (categoryId) => {
    if (window.confirm('Kategoriyani o\'chirmoqchimisiz?')) {
      try {
        await deleteDoc(doc(db, 'categories', categoryId));
        onDeleteCategory(categoryId);
        toast.success('✅ Kategoriya o\'chirildi!');
      } catch (error) {
        console.error('Xato:', error);
        toast.error('❌ Xatolik yuz berdi!');
      }
    }
  };

  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Kirim qilish</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddCategory(!showAddCategory)}
            className="flex items-center gap-2 px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            <FolderPlus className="w-5 h-5" />
            Kategoriya
          </button>
          <button
            onClick={() => setShowAddProduct(!showAddProduct)}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <PackagePlus className="w-5 h-5" />
            Mahsulot
          </button>
        </div>
      </div>

      {/* Kategoriya qo'shish */}
      {showAddCategory && (
        <div className="p-4 mb-6 border border-purple-200 rounded-lg bg-purple-50">
          <h3 className="mb-3 font-bold text-purple-900">Yangi kategoriya</h3>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Kategoriya nomi"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addNewCategory();
                }
              }}
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <button
              onClick={addNewCategory}
              disabled={saving}
              className="px-6 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? 'Saqlanmoqda...' : 'Qo\'shish'}
            </button>
          </div>

          {/* Kategoriyalar ro'yxati */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map(cat => (
              <div
                key={cat.id}
                className="flex items-center gap-2 px-3 py-1 bg-white border border-purple-200 rounded-lg"
              >
                <span className="text-sm">{cat.name}</span>
                <button
                  onClick={() => removeCategoryHandler(cat.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mahsulot qo'shish */}
      {showAddProduct && (
        <div className="p-4 mb-6 border border-blue-200 rounded-lg bg-blue-50">
          <h3 className="mb-3 font-bold text-blue-900">Yangi mahsulot qo'shish</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input
              type="text"
              placeholder="Mahsulot nomi *"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="px-4 py-2 border rounded-lg"
            />
            <select
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">Kategoriya *</option>
              {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
            </select>
            <input
              type="number"
              placeholder="Narxi *"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              className="px-4 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Barcode"
              value={newProduct.barcode}
              onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
              className="px-4 py-2 border rounded-lg"
            />
            <input
              type="number"
              placeholder="Boshlang'ich miqdor"
              value={newProduct.quantity}
              onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
              className="px-4 py-2 border rounded-lg"
            />
            <button
              onClick={addNewProduct}
              disabled={saving}
              className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Saqlanmoqda...' : 'Qo\'shish'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Mahsulotlar ro'yxati */}
        <div className="p-6 bg-white rounded-lg shadow lg:col-span-2">
          <div className="flex gap-2 mb-4">
            {/* USB Scanner Input */}
            <div className="relative flex-1">
              <Scan className="absolute w-5 h-5 text-gray-400 left-3 top-3" />
              <input
                type="text"
                placeholder="USB barcode scanner yoki qidiruv..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchTerm) {
                    // USB scanner Enter bosadi
                    const product = products.find(p => p.barcode === searchTerm);
                    if (product) {
                      handleBarcodeScan(searchTerm);
                    }
                  }
                }}
                className="w-full py-2 pl-10 pr-4 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Kamera Scanner */}
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
              title="Kamera bilan scan"
            >
              <Camera className="w-5 h-5" />
              Kamera
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-96">
            {filteredProducts.length === 0 ? (
              <p className="py-8 text-center text-gray-500">Mahsulot topilmadi</p>
            ) : (
              filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="flex items-center justify-between p-4 transition border rounded-lg cursor-pointer hover:bg-blue-50"
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
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-bold text-gray-800">Tanlangan mahsulotlar</h3>
          
          <div className="mb-4 space-y-2 overflow-y-auto max-h-64">
            {selectedItems.length === 0 ? (
              <p className="py-8 text-sm text-center text-gray-500">Bo'sh</p>
            ) : (
              selectedItems.map(item => (
                <div key={item.id} className="p-3 border rounded-lg">
                  <p className="mb-2 text-sm font-medium text-gray-800">{item.name}</p>
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
                        className="w-16 px-2 py-1 text-center border rounded"
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

          <div className="pt-4 space-y-2 border-t">
            <div className="flex justify-between text-lg font-bold">
              <span>Jami:</span>
              <span className="text-blue-600">{totalAmount.toLocaleString()} so'm</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={selectedItems.length === 0 || saving}
              className="w-full py-3 font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saqlanmoqda...' : 'Kirim qilish'}
            </button>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default Income;