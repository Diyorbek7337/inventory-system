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
          <h2>Inventory shop</h2>
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Savdo cheklari</h2>
        <div className="text-gray-600">
          <Receipt className="inline w-5 h-5 mr-2" />
          Jami: <span className="font-bold">{filteredSales.length}</span> ta
        </div>
      </div>

      {/* Filtrlar */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative">
            <Search className="absolute w-5 h-5 text-gray-400 left-3 top-3" />
            <input
              type="text"
              placeholder="Mijoz yoki mahsulot qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {filteredSales.length === 0 ? (
          <div className="py-12 text-center text-gray-500 col-span-full">
            <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Savdo topilmadi</p>
          </div>
        ) : (
          filteredSales.map(sale => (
            <div
              key={sale.saleId}
              className="p-6 transition bg-white rounded-lg shadow cursor-pointer hover:shadow-lg"
              onClick={() => setSelectedSale(sale)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500">Chek #{sale.saleId.slice(-8)}</p>
                  <p className="mt-1 text-sm text-gray-600">
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

              <div className="mb-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="w-4 h-4 mr-2" />
                  <span>{sale.customerName}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Package className="w-4 h-4 mr-2" />
                  <span>{sale.items.length} ta mahsulot</span>
                </div>
              </div>

              <div className="pt-4 space-y-2 border-t">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Chek #{selectedSale.saleId.slice(-8)}</h3>
                <p className="mt-1 text-gray-600">
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

            <div className="p-4 mb-6 rounded-lg bg-gray-50">
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
              <h4 className="mb-3 font-semibold text-gray-800">Mahsulotlar:</h4>
              <div className="space-y-2">
                {selectedSale.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
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

            <div className="pt-4 space-y-3 border-t">
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
                className="flex-1 px-4 py-2 font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Yopish
              </button>
              <button
                onClick={() => printReceipt(selectedSale)}
                className="flex items-center justify-center flex-1 gap-2 px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
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