import React, { useState } from 'react';
import { Receipt, Calendar, Search, DollarSign, User, Package } from 'lucide-react';

const Sales = ({ transactions, products }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('bugun');
  const [selectedSale, setSelectedSale] = useState(null);

  // Savdolarni saleId bo'yicha guruhlash
  const getSales = () => {
    const salesMap = {};

    transactions
      .filter(t => t.type === 'chiqim')
      .forEach(t => {
        const saleId = t.saleId || t.id;
        if (!salesMap[saleId]) {
          salesMap[saleId] = {
            saleId: saleId,
            items: [],
            date: t.date,
            customerName: t.customerName || 'Naqd',
            totalAmount: 0,
            paidAmount: 0,
            debt: 0,
            paymentType: t.paymentType
          };
        }
        salesMap[saleId].items.push(t);
        salesMap[saleId].totalAmount += t.totalAmount || (t.quantity * t.price);
        salesMap[saleId].paidAmount += t.paidAmount || 0;
        salesMap[saleId].debt += t.debt || 0;
      });

    return Object.values(salesMap).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Sanaga qarab filtrlash
  const getFilteredSales = () => {
    const sales = getSales();
    const now = new Date();
    let startDate = new Date();

    switch (dateFilter) {
      case 'bugun':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'kecha':
        startDate.setDate(now.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'hafta':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'oy':
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate = new Date(0);
    }

    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const matchesDate = dateFilter === 'hammasi' || saleDate >= startDate;
      const matchesSearch = !searchTerm || 
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesDate && matchesSearch;
    });
  };

  const filteredSales = getFilteredSales();

  // Chek ko'rinishi
  const printReceipt = (sale) => {
    const receiptWindow = window.open('', '_blank');
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Chek #${sale.saleId}</title>
        <style>
          body { font-family: monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { border-top: 2px dashed #000; padding-top: 10px; margin-top: 10px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>DO'KON NOMI</h2>
          <p>Sana: ${new Date(sale.date).toLocaleString('uz-UZ')}</p>
          <p>Chek: #${sale.saleId}</p>
          ${sale.customerName !== 'Naqd' ? `<p>Mijoz: ${sale.customerName}</p>` : ''}
        </div>
        
        <div class="items">
          ${sale.items.map(item => `
            <div class="item">
              <span>${item.productName} x${item.quantity}</span>
              <span>${(item.quantity * item.price).toLocaleString()} so'm</span>
            </div>
          `).join('')}
        </div>
        
        <div class="total">
          <div class="item">
            <span>JAMI:</span>
            <span>${sale.totalAmount.toLocaleString()} so'm</span>
          </div>
          <div class="item">
            <span>To'landi:</span>
            <span>${sale.paidAmount.toLocaleString()} so'm</span>
          </div>
          ${sale.debt > 0 ? `
            <div class="item" style="color: red;">
              <span>Qarz:</span>
              <span>${sale.debt.toLocaleString()} so'm</span>
            </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>Rahmat! Yana tashrif buyuring!</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;
    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Savdo cheklari</h2>
        <div className="text-gray-600">
          <Receipt className="w-5 h-5 inline mr-2" />
          Jami: <span className="font-bold">{filteredSales.length}</span> ta
        </div>
      </div>

      {/* Filtrlar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Mijoz yoki mahsulot qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            {['bugun', 'kecha', 'hafta', 'oy', 'hammasi'].map(period => (
              <button
                key={period}
                onClick={() => setDateFilter(period)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  dateFilter === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period === 'bugun' ? 'Bugun' :
                 period === 'kecha' ? 'Kecha' :
                 period === 'hafta' ? 'Hafta' :
                 period === 'oy' ? 'Oy' : 'Hammasi'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Savdolar ro'yxati */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredSales.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Savdo topilmadi</p>
          </div>
        ) : (
          filteredSales.map(sale => (
            <div
              key={sale.saleId}
              className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 cursor-pointer"
              onClick={() => setSelectedSale(sale)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs text-gray-500">Chek #{sale.saleId.slice(-8)}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(sale.date).toLocaleString('uz-UZ', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <Receipt className="w-8 h-8 text-blue-500" />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="w-4 h-4 mr-2" />
                  <span>{sale.customerName}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Package className="w-4 h-4 mr-2" />
                  <span>{sale.items.length} ta mahsulot</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Jami:</span>
                  <span className="font-bold">{sale.totalAmount.toLocaleString()} so'm</span>
                </div>
                {sale.debt > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Qarz:</span>
                    <span className="font-bold text-red-600">{sale.debt.toLocaleString()} so'm</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <span className={`flex-1 text-center px-3 py-1 rounded-full text-xs font-semibold ${
                  sale.paymentType === 'to\'liq' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {sale.paymentType === 'to\'liq' ? 'To\'liq to\'langan' : 'Qarz'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chek detallari modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Chek #{selectedSale.saleId.slice(-8)}</h3>
                <p className="text-gray-600 mt-1">
                  {new Date(selectedSale.date).toLocaleString('uz-UZ')}
                </p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Mijoz</p>
                  <p className="font-medium text-gray-900">{selectedSale.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">To'lov turi</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedSale.paymentType === 'to\'liq'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedSale.paymentType === 'to\'liq' ? 'To\'liq' : 'Qarz'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">Mahsulotlar:</h4>
              <div className="space-y-2">
                {selectedSale.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-sm text-gray-600">
                        {item.price.toLocaleString()} so'm × {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold text-gray-900">
                      {(item.quantity * item.price).toLocaleString()} so'm
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-lg">
                <span className="text-gray-600">Jami:</span>
                <span className="font-bold">{selectedSale.totalAmount.toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">To'landi:</span>
                <span className="font-bold text-green-600">{selectedSale.paidAmount.toLocaleString()} so'm</span>
              </div>
              {selectedSale.debt > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Qarz:</span>
                  <span className="font-bold text-red-600">{selectedSale.debt.toLocaleString()} so'm</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedSale(null)}
                className="flex-1 bg-gray-200 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-300 font-medium"
              >
                Yopish
              </button>
              <button
                onClick={() => printReceipt(selectedSale)}
                className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
              >
                <Receipt className="w-5 h-5" />
                Chop etish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;