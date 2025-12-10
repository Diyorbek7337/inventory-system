import React, { useState } from 'react';
import { Search, Trash2, Edit, Package, FolderPlus, Camera, Scan } from 'lucide-react';
import { deleteDoc, doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';
import BarcodeScanner from './BarcodeScanner';

const ProductList = ({ products, categories, onDeleteProduct, onUpdateProduct, onAddCategory, onDeleteCategory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showScanner, setShowScanner] = useState(false); // YANGI!

  const allCategories = ['Barchasi', ...categories.map(c => c.name)];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.barcode?.includes(searchTerm);
    const matchesCategory = !categoryFilter || categoryFilter === 'Barchasi' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });


  // Barcode scan qilganda
  const handleBarcodeScan = (barcode) => {
    setSearchTerm(barcode);
    
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      // Mahsulotni topdi - jadvalda highlight qilish uchun
      toast.success(`${product.name} topildi!`);
      
      // Scroll to product (optional)
      setTimeout(() => {
        const element = document.getElementById(`product-${product.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('bg-blue-100');
          setTimeout(() => element.classList.remove('bg-blue-100'), 2000);
        }
      }, 100);
    } else {
      toast.warning(`Barcode: ${barcode} - Mahsulot topilmadi!`);
    }
  };

  const deleteProduct = async (id) => {
    if (window.confirm('Mahsulotni o\'chirmoqchimisiz?')) {
      const loadingToast = toast.loading('O\'chirilmoqda...');
      try {
        await deleteDoc(doc(db, 'products', id));
        onDeleteProduct(id);
        toast.update(loadingToast, {
          render: '✅ Mahsulot o\'chirildi!',
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
    }
  };

  const saveEdit = async () => {
    if (!editingProduct.name || !editingProduct.price) {
      toast.error('Majburiy maydonlarni to\'ldiring!');
      return;
    }

    setSaving(true);
    const loadingToast = toast.loading('Saqlanmoqda...');

    try {
      const updatedData = {
        name: editingProduct.name,
        category: editingProduct.category,
        price: parseFloat(editingProduct.price),
        barcode: editingProduct.barcode,
        quantity: parseInt(editingProduct.quantity)
      };

      await updateDoc(doc(db, 'products', editingProduct.id), updatedData);
      onUpdateProduct({ ...editingProduct, ...updatedData });
      setEditingProduct(null);
      
      toast.update(loadingToast, {
        render: '✅ Mahsulot yangilandi!',
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
      setShowAddCategory(false);
      toast.success('✅ Kategoriya qo\'shildi!');
    } catch (error) {
      console.error('Xato:', error);
      toast.error('❌ Xatolik yuz berdi!');
    }
    setSaving(false);
  };

  const removeCategoryHandler = async (categoryId) => {
    const categoryName = categories.find(c => c.id === categoryId)?.name;
    const hasProducts = products.some(p => p.category === categoryName);

    if (hasProducts) {
      toast.error('Bu kategoriyada mahsulotlar mavjud! Avval mahsulotlarni o\'zgartiring.');
      return;
    }

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

  const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);
  const lowStockCount = products.filter(p => p.quantity < 10 && p.quantity > 0).length;
  const outOfStockCount = products.filter(p => p.quantity === 0).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Mahsulotlar ro'yxati</h2>
          <p className="mt-1 text-sm text-gray-600">
            Jami qiymat: <span className="font-bold text-green-600">{totalValue.toLocaleString()} so'm</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-right">
            <p className="text-gray-600">
              <span className="font-bold">{products.length}</span> ta mahsulot
            </p>
            {lowStockCount > 0 && (
              <p className="text-yellow-600">
                <span className="font-bold">{lowStockCount}</span> ta kam qolgan
              </p>
            )}
            {outOfStockCount > 0 && (
              <p className="text-red-600">
                <span className="font-bold">{outOfStockCount}</span> ta tugagan
              </p>
            )}
          </div>
          <button
            onClick={() => setShowAddCategory(!showAddCategory)}
            className="flex items-center gap-2 px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            <FolderPlus className="w-5 h-5" />
            Kategoriya
          </button>
        </div>
      </div>

      {/* Kategoriya qo'shish */}
      {showAddCategory && (
        <div className="p-4 mb-6 border border-purple-200 rounded-lg bg-purple-50">
          <h3 className="mb-3 font-bold text-purple-900">Kategoriya boshqaruvi</h3>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Yangi kategoriya nomi"
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

          <div className="flex flex-wrap gap-2">
            {categories.map(cat => {
              const count = products.filter(p => p.category === cat.name).length;
              return (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-purple-200 rounded-lg"
                >
                  <span className="text-sm font-medium">{cat.name}</span>
                  <span className="text-xs text-gray-500">({count})</span>
                  <button
                    onClick={() => removeCategoryHandler(cat.id)}
                    className="ml-2 text-red-500 hover:text-red-700"
                    title={count > 0 ? "Bu kategoriyada mahsulotlar bor" : "O'chirish"}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtrlar + Barcode Scanner */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* USB Scanner Input + Search */}
          <div className="flex gap-2">
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
              <span className="hidden sm:inline">Kamera</span>
            </button>
          </div>

          {/* Kategoriya filtri */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mahsulotlar jadvali */}
      <div className="overflow-hidden bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Mahsulot</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Kategoriya</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Barcode</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Narx</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Miqdor</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Jami qiymat</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Amallar</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Mahsulot topilmadi</p>
                    {searchTerm && (
                      <p className="mt-2 text-sm">Qidiruv: "{searchTerm}"</p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, index) => (
                  <tr 
                    key={product.id} 
                    id={`product-${product.id}`}
                    className="transition-colors duration-200 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold leading-5 text-blue-800 bg-blue-100 rounded-full">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-500 whitespace-nowrap">
                      {product.barcode || (
                        <span className="italic text-gray-400">yo'q</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {product.price?.toLocaleString()} so'm
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.quantity === 0 ? 'bg-red-100 text-red-800' :
                        product.quantity < 10 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {product.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">
                      {((product.quantity || 0) * (product.price || 0)).toLocaleString()} so'm
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Tahrirlash"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* {totalSum.toLocaleString()} so'm */}
        </div>
      </div>

      {/* Tahrirlash modali */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-gray-800">Mahsulotni tahrirlash</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Nomi *</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Kategoriya *</label>
                <select
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Narx *</label>
                <input
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Barcode</label>
                <input
                  type="text"
                  value={editingProduct.barcode}
                  onChange={(e) => setEditingProduct({...editingProduct, barcode: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Miqdor</label>
                <input
                  type="number"
                  value={editingProduct.quantity}
                  onChange={(e) => setEditingProduct({...editingProduct, quantity: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="p-3 text-sm text-yellow-800 border border-yellow-200 rounded-lg bg-yellow-50">
                ⚠️ Miqdorni o'zgartirish tavsiya etilmaydi. Kirim/Chiqim orqali boshqaring.
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Bekor qilish
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default ProductList;