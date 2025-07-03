import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Product {
  _id: string;
  name: string;
  price: number;
  category_id: string;
  categoryName: string;
  description: string;
  pictureUrl?: string | null;
  displayPrice: string;
  isActive: boolean;
  time_required?: number;
}

interface OrderItem {
  product_id: string;
  quantity: number;
  product?: Product;
  sub_total?: number;
}

export interface OrderDetailsProps {
  customerName: string;
  setCustomerName: (name: string) => void;
  serviceType: 'dine_in' | 'take_away';
  setServiceType: (type: 'dine_in' | 'take_away') => void;
  receivedAmount: number;
  setReceivedAmount: (amount: number) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  orderItems: OrderItem[];
  setOrderItems: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  calculateTotalOrderAmount: () => number;
  handleCreateOrder: () => void;
  localLoading: boolean;
}

const OrderDetails = ({
  customerName,
  setCustomerName,
  serviceType,
  setServiceType,
  receivedAmount,
  setReceivedAmount,
  paymentMethod,
  setPaymentMethod,
  orderItems,
  setOrderItems,
  calculateTotalOrderAmount,
  handleCreateOrder,
  localLoading,
}: OrderDetailsProps) => {
  const totalAmount = calculateTotalOrderAmount();
  const showPayment = serviceType === 'take_away';

  return (
    <div className="lg:w-1/3 w-full bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Order Details</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
          <input
            type="text"
            placeholder="Enter customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-200 border-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value as 'dine_in' | 'take_away')}
            className="w-full p-2 border rounded-lg focus:ring-2 transition-all duration-200 product-crud-input focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)]"
            style={{
              backgroundColor: 'var(--background-secondary)',
              color: 'var(--text-color)',
              borderColor: 'var(--border-color)',
            }}
          >
            <option value="dine_in">Dine-In</option>
            <option value="take_away">Takeaway</option>
          </select>
        </div>

        {showPayment && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Received Amount *</label>
              <input
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(Number(e.target.value))}
                min={totalAmount}
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                placeholder={`Minimum: $${totalAmount.toFixed(2)}`}
              />
              {receivedAmount < totalAmount && receivedAmount > 0 && (
                <p className="text-red-500 text-xs mt-1">Amount must be at least ${totalAmount.toFixed(2)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method *</label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentMethod === 'cash'}
                    onChange={() => setPaymentMethod('cash')}
                    className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Cash</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Card</span>
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <h3 className="font-semibold">Order Summary</h3>
          {orderItems.length === 0 ? (
            <p className="text-gray-500">No items added to the order</p>
          ) : (
            <>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4">Item</th>
                    <th className="py-2 px-4">Qty</th>
                    <th className="py-2 px-4">Price</th>
                    <th className="py-2 px-4">Total</th>
                    <th className="py-2 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, index) => (
                    <tr key={item.product_id} className="border-b">
                      <td className="py-2 px-4">{item.product?.name || `Product ${item.product_id}`}</td>
                      <td className="py-2 px-4">{item.quantity}</td>
                      <td className="py-2 px-4">${(item.product?.price || 0).toFixed(2)}</td>
                      <td className="py-2 px-4">${(item.sub_total || 0).toFixed(2)}</td>
                      <td className="py-2 px-4">
                        <XMarkIcon
                          onClick={() => setOrderItems(orderItems.filter((_, i) => i !== index))}
                          className="h-5 w-5 text-red-500 cursor-pointer hover:text-red-700"
                        />
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td colSpan={3} className="py-2 px-4 text-right">Total</td>
                    <td className="py-2 px-4">${totalAmount.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </div>

        <button
          onClick={handleCreateOrder}
          disabled={localLoading}
          className={`w-full py-2 rounded-lg transition-all duration-200 ${localLoading
            ? 'bg-[var(--background-secondary)] text-[var(--text-secondary)] cursor-not-allowed'
            : 'bg-[var(--primary-color)] text-[var(--surface-color)] hover:text-white'
            }`}
        >
          {localLoading ? 'Processing Order...' : showPayment ? 'Confirm Order & Process Payment' : 'Confirm Order'}
        </button>
      </div>
    </div>
  );
};

export default OrderDetails;
