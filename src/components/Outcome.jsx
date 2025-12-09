import React, { useState } from 'react';
import { PackageMinus, Search, User } from 'lucide-react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';

const Outcome = ({ products, onUpdateProduct, onAddTransaction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentType, setPaymentType] = useState('to\'liq');
  const [saving, setSaving] = useState(false);

  const filteredProducts = products.filter(p =>
    (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.includes(searchTerm)) &&
    p.quantity > 0
  );

  const addToCart = (product) => {
    const existing = selectedItems.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity < product.quantity) {
        setSelectedItems(selectedItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ));
        toast.success(`${product.name} savatga qo'shildi`);
      } else {
        toast.warning(`Omborda faqat ${product.quantity} dona mavjud!`);
      }
    } else {
      setSelectedItems([...selectedItems, { ...product, quantity: 1 }]);
      toast.success(`${product.name} savatga qo'shildi`);
    }
  };

  const updateQuantity = (id, quantity) => {
    const product = products.find(p => p.id === id);
    if (quantity <= 0) {
      setSelectedItems(selectedItems.filter(item => item.id !== id));
    } else if (quantity > product.quantity) {
      toast.warning(`Omborda faqat ${product.quantity} dona mavjud!`);
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

    const totalAmount = selectedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const paid = parseFloat(paidAmount) || 0;
    const debt = totalAmount - paid;

    if (paymentType === 'qarz' && !customerName.trim()) {
      toast.error('Mijoz ismini kiriting!');
      return;
    }

    if (paid > totalAmount) {
      toast.error('To\'langan summa umumiy summadan oshib ketdi!');
      return;
    }

    setSaving(true);
    const loadingToast = toast.loading('Sotilmoqda...');

    try {
      const saleId = Date.now().toString();

      for (const item of selectedItems) {
        const product = products.find(p => p.id === item.id);
        const newQuantity = product.quantity - item.quantity;

        await updateDoc(doc(db, 'products', item.id), {
          quantity: newQuantity
        });

        onUpdateProduct({ ...product, quantity: newQuantity });

        const transactionData = {
          saleId: saleId,
          productId: item.id,
          productName: item.name,
          type: 'chiqim',
          quantity: item.quantity,
          price: item.price,
          totalAmount: item.quantity * item.price,
          paidAmount: paymentType === 'to\'liq' ? item.quantity * item.price : (paid / totalAmount) * (item.quantity * item.price),
          debt: paymentType === 'qarz' ? (debt / totalAmount) * (item.quantity * item.price) : 0,
          customerName: customerName.trim() || 'Naqd',
          paymentType: paymentType,
          date: new Date()
        };

        const docRef = await addDoc(collection(db, 'transactions'), transactionData);
        onAddTransaction({ id: docRef.id, ...transactionData });
      }

      setSelectedItems([]);
      setCustomerName('');
      setPaidAmount('');
      setPaymentType('to\'liq');
      
      toast.update(loadingToast, {
        render: `✅ Sotildi! ${debt > 0 ? `Qarz: ${debt.toLocaleString()} so'm` : ''}`,
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

  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const paid = parseFloat(paidAmount) || 0;
  const remaining = totalAmount - paid;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Chiqim qilish (Sotish)</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  className="flex justify-between items-center p-4 border rounded-lg hover:bg-red-50 cursor-pointer transition"
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
                    <p className={`text-sm ${product.quantity < 10 ? 'text-red-500' : 'text-green-500'}`}>
                      Qoldi: {product.quantity}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Savat</h3>
            
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
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
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">To'lov</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To'lov turi</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPaymentType('to\'liq');
                      setPaidAmount(totalAmount.toString());
                    }}
                    className={`flex-1 py-2 rounded-lg ${
                      paymentType === 'to\'liq' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    To'liq
                  </button>
                  <button
                    onClick={() => {
                      setPaymentType('qarz');
                      setPaidAmount('0');
                    }}
                    className={`flex-1 py-2 rounded-lg ${
                      paymentType === 'qarz' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Qarz
                  </button>
                </div>
              </div>

              {paymentType === 'qarz' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mijoz ismi</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Ism va familiya"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To'langan summa</label>
                <input
                  type="number"
                  placeholder="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Jami:</span>
                  <span className="font-bold">{totalAmount.toLocaleString()} so'm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">To'landi:</span>
                  <span className="font-bold text-green-600">{paid.toLocaleString()} so'm</span>
                </div>
                {remaining > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Qarz:</span>
                    <span className="font-bold text-red-600">{remaining.toLocaleString()} so'm</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={selectedItems.length === 0 || saving}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {saving ? 'Saqlanmoqda...' : 'Sotish'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Outcome;