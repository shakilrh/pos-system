import React from 'react';

interface ReceiptProps {
  orderNumber: string;
  customerName: string;
  serviceType: 'dine_in' | 'take_away';
  date: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  paymentMethod: string;
  receivedAmount: number;
}

const ReceiptTemplate: React.FC<ReceiptProps> = ({ orderNumber, customerName, serviceType, date, items, totalAmount, paymentMethod, receivedAmount }) => {
  const change = receivedAmount - totalAmount;

  return (
    <div className="lg:w-1/3 w-full bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Receipt</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Order #:</label>
          <p>{orderNumber}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer:</label>
          <p>{customerName || 'Guest'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Type:</label>
          <p>{serviceType === 'dine_in' ? 'Dine-In' : 'Takeaway'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
          <p>{date}</p>
        </div>
        <div className="mt-4">
          <h3 className="font-semibold">Order Summary</h3>
          {items.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
              <tr className="border-b">
                <th className="py-2 px-4">Item</th>
                <th className="py-2 px-4">Qty</th>
                <th className="py-2 px-4">Price</th>
                <th className="py-2 px-4">Total</th>
              </tr>
              </thead>
              <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2 px-4">{item.name}</td>
                  <td className="py-2 px-4">{item.quantity}</td>
                  <td className="py-2 px-4">${item.price.toFixed(2)}</td>
                  <td className="py-2 px-4">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td colSpan="3" className="py-2 px-4 text-right">Total</td>
                <td className="py-2 px-4">${totalAmount.toFixed(2)}</td>
              </tr>
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">No items</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method:</label>
          <p>{paymentMethod}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Received:</label>
          <p>${receivedAmount.toFixed(2)}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Change:</label>
          <p>${change.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default ReceiptTemplate;
