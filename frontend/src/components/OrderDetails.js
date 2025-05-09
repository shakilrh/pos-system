import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getOrderDetails } from '../utils/api';
import Sidebar from './Sidebar';

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        console.log(`Fetching order details for ID: ${id}`);
        const response = await getOrderDetails(id);
        console.log('OrderDetails raw response:', response);
        console.log('OrderDetails data:', response.data);
        setOrder(response.data.order);
        setOrderItems(response.data.orderItems);
        setError(null);
      } catch (err) {
        console.error('Error fetching order details:', err);
        const errorMessage = err.response?.data?.message || 'Failed to load order details. Please try again.';
        setError(errorMessage);
      }
    };
    fetchOrderDetails();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (error) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <div className="search-card slide-down">
            <div className="card-body">
              <h1 className="checkout-title">🛒 Order Details</h1>
              <div className="alert-danger">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <div className="search-card slide-down">
            <div className="card-body">
              <h1 className="checkout-title">🛒 Order Details</h1>
              <div>Loading...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="printable-content">
          <div className="search-card order-details-card slide-down">
            <div className="card-body">
              <div className="card-header flex justify-between items-center mb-4">
                <h1 className="checkout-title">🛒 Order Details</h1>
                <button
                  className="btn-custom btn-lg no-print"
                  style={{ backgroundColor: '#28a745', color: '#fff' }}
                  onClick={handlePrint}
                >
                  🖨️ Print
                </button>
              </div>

              <div className="card shadow-sm mb-4">
                <div className="card-body">
                  <h5
                    className="card-section-title"
                    style={{ borderBottom: '2px solid #28a745', paddingBottom: '5px', marginBottom: '15px' }}
                  >
                    Customer Information
                  </h5>
                  <p><strong>👤 Customer Name:</strong> {order.customerName}</p>
                  <p><strong>📅 Order Date:</strong> {new Date(order.dateCreated).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
              </div>

              <div className="card shadow-sm mb-4">
                <div className="card-body">
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                      <tr>
                        <th><span className="me-1">📦</span> Product Name</th>
                        <th><span className="me-1">💲</span> Item Price</th>
                        <th><span className="me-1">🔢</span> Quantity</th>
                        <th><span className="me-1">📊</span> Subtotal</th>
                      </tr>
                      </thead>
                      <tbody>
                      {orderItems.length > 0 ? (
                        orderItems.map((item, index) => (
                          <tr key={index} className="fade-scale-row visible">
                            <td>{item.productName}</td>
                            <td style={{ color: '#28a745' }} className="font-bold">{item.price.toFixed(2)} PKR</td>
                            <td className="text-center">{item.quantity}</td>
                            <td style={{ color: '#28a745' }} className="font-bold">{item.subtotal.toFixed(2)} PKR</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center">
                            No items found for this order.
                          </td>
                        </tr>
                      )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm">
                <div className="card-body">
                  <p style={{ color: '#28a745' }} className="font-bold"><strong>💰 Subtotal Price:</strong> {order.subtotal.toFixed(2)} PKR</p>
                  <p style={{ color: '#d9534f' }} className="font-bold"><strong>➖ Discount Amount:</strong> {order.discountAmount.toFixed(2)} PKR</p>
                  <p style={{ color: '#28a745' }} className="font-bold"><strong>💰 Total Price:</strong> {order.totalAmount.toFixed(2)} PKR</p>
                  <p style={{ color: '#007bff' }} className="font-bold"><strong>💵 Amount Received:</strong> {order.amountReceived.toFixed(2)} PKR</p>
                  <p style={{ color: '#d9534f' }} className="font-bold"><strong>➖ Amount Returned:</strong> {order.remainingAmount.toFixed(2)} PKR</p>
                  <p style={{ color: '#28a745' }} className="font-bold"><strong>💸 Lease Amount:</strong> {order.leaseAmount.toFixed(2)} PKR</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
// /*test
export default OrderDetails;
