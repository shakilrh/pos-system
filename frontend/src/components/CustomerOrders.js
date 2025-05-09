import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';

const CustomerOrders = () => {
  const [customerName, setCustomerName] = useState('');
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalLeaseAmount, setTotalLeaseAmount] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [sortDirection, setSortDirection] = useState({ orders: {}, payments: {} });

  const searchOrders = async () => {
    try {
      const response = await axios.get('/api/order/searchCustomerOrders', {
        params: { customerName },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.data.status === 'success') {
        setOrders(response.data.orders);
        setPayments(response.data.payments);
        setTotalSales(response.data.totalSales);
        setTotalLeaseAmount(response.data.totalLeaseAmount);
        setErrors({});
        setMessage('');
      } else {
        setErrors({ search: response.data.message });
      }
    } catch (err) {
      setErrors({ search: err.response?.data?.message || 'Server error occurred.' });
    }
  };

  const addPayment = async () => {
    try {
      const response = await axios.post(
        '/api/order/addPayment',
        { customerName, paymentAmount },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.data.status === 'success') {
        setTotalLeaseAmount(response.data.totalLeaseAmount);
        setPayments([
          ...payments,
          {
            amount: parseFloat(paymentAmount),
            dateCreated: new Date().toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ]);
        setMessage(response.data.message);
        setPaymentAmount('');
        setErrors({ ...errors, payment: '' });
      } else {
        setErrors({ ...errors, payment: response.data.message });
        setMessage(response.data.message);
      }
    } catch (err) {
      setErrors({ ...errors, payment: err.response?.data?.message || 'Server error occurred.' });
      setMessage('Server error occurred.');
    }
  };

  const sortTable = (table, column, dataType) => {
    const direction = sortDirection[table][column] === 'asc' ? 'desc' : 'asc';
    const sortedData = [...(table === 'orders' ? orders : payments)].sort((a, b) => {
      let valA = a[column];
      let valB = b[column];
      if (dataType === 'number') {
        valA = parseFloat(valA);
        valB = parseFloat(valB);
      } else if (dataType === 'date') {
        valA = new Date(valA);
        valB = new Date(valB);
      } else {
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();
      }
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    if (table === 'orders') setOrders(sortedData);
    else setPayments(sortedData);
    setSortDirection({
      ...sortDirection,
      [table]: { ...sortDirection[table], [column]: direction },
    });
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="search-card">
          <div className="card-body">
            <h1 className="checkout-title">
              <span className="me-2">📋</span>Customer Order Details
            </h1>

            <div className="mb-4">
              <div className="row g-3 align-items-end">
                <div className="col-auto">
                  <label htmlFor="customerName" className="form-label">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    className="form-control"
                    placeholder="Enter customer name..."
                    style={{ maxWidth: '300px' }}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="col-auto">
                  <label className="form-label d-block">&nbsp;</label>
                  <button type="button" className="btn-custom" onClick={searchOrders}>
                    <span className="me-2">🔍</span>Search Orders
                  </button>
                </div>
              </div>
              {errors.search && <div className="error-message mt-1">❌ {errors.search}</div>}
            </div>

            <div className="table-responsive">
              <table className="table">
                <thead>
                <tr>
                  <th
                    onClick={() => sortTable('orders', 'id', 'number')}
                  >
                    Order ID
                  </th>
                  <th
                    onClick={() => sortTable('orders', 'customerName', 'string')}
                  >
                    Customer
                  </th>
                  <th
                    onClick={() => sortTable('orders', 'totalAmount', 'number')}
                  >
                    Total
                  </th>
                  <th
                    onClick={() => sortTable('orders', 'dateCreated', 'date')}
                  >
                    Date
                  </th>
                  <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {orders.length > 0 ? (
                  orders.map((order, index) => (
                    <tr key={order.id} className="fade-row visible" style={{ transitionDelay: `${index * 0.1}s` }}>
                      <td>#{order.id}</td>
                      <td>{order.customerName}</td>
                      <td style={{ color: 'var(--primary-color)' }}>{order.totalAmount.toFixed(2)} PKR</td>
                      <td>{order.dateCreated}</td>
                      <td>
                        <Link to={`/order-details/${order.id}`} className="btn-custom btn-sm">
                          <span className="me-1">📄</span>Details
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No orders found for this customer.
                    </td>
                  </tr>
                )}
                </tbody>
              </table>
            </div>

            <div className="mt-3">
              <div className="total-sales" style={{ display: orders.length > 0 ? 'block' : 'none' }}>
                Total Sales: <span style={{ color: 'var(--primary-color)' }}>{totalSales.toFixed(2)} PKR</span>
              </div>
              <div
                className="total-lease mt-2"
                style={{ display: orders.length > 0 ? 'block' : 'none' }}
              >
                Total Lease Amount:{' '}
                <span style={{ color: totalLeaseAmount < 0 ? 'var(--logout-bg)' : 'var(--primary-color)' }}>
                  {totalLeaseAmount.toFixed(2)} PKR
                </span>
              </div>
              <div className="mt-2" style={{ display: orders.length > 0 ? 'block' : 'none' }}>
                <div className="row g-2 align-items-end">
                  <div className="col-auto">
                    <label htmlFor="paymentAmount" className="form-label">
                      Add Money
                    </label>
                    <input
                      type="number"
                      id="paymentAmount"
                      className="form-control"
                      placeholder="Enter amount"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>
                  <div className="col-auto">
                    <button type="button" className="btn-custom" onClick={addPayment}>
                      OK
                    </button>
                  </div>
                </div>
                {errors.payment && <div className="error-message mt-1">❌ {errors.payment}</div>}
              </div>
              {message && (
                <div className={`mt-2 alert ${errors.payment ? 'alert-danger' : 'alert-success'}`}>
                  {message}
                </div>
              )}

              <div
                className="table-responsive mt-3"
                style={{ display: payments.length > 0 ? 'block' : 'none', maxWidth: '500px' }}
              >
                <h5>Payment History</h5>
                <table className="table">
                  <thead>
                  <tr>
                    <th
                      onClick={() => sortTable('payments', 'amount', 'number')}
                    >
                      Amount
                    </th>
                    <th
                      onClick={() => sortTable('payments', 'dateCreated', 'date')}
                    >
                      Date
                    </th>
                  </tr>
                  </thead>
                  <tbody>
                  {payments.length > 0 ? (
                    payments.map((payment, index) => (
                      <tr key={index} className="fade-row visible" style={{ transitionDelay: `${index * 0.1}s` }}>
                        <td style={{ color: 'var(--primary-color)' }}>{payment.amount.toFixed(2)} PKR</td>
                        <td>{payment.dateCreated}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="text-center">
                        No payments recorded.
                      </td>
                    </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrders;
// /*test
