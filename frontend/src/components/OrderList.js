import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listOrders } from '../utils/api';
import Sidebar from './Sidebar';

const OrderList = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await listOrders(startDate || undefined, endDate || undefined);
      console.log('OrderList raw response:', response);
      console.log('OrderList data:', response.data);

      const fetchedOrders = response.data.orders || [];
      const fetchedTotalSales = response.data.totalSales || 0;

      setOrders(fetchedOrders);
      setTotalSales(fetchedTotalSales);
      setErrors({});
    } catch (err) {
      console.error('Error fetching orders:', err);
      setErrors({ general: err.response?.data?.message || 'Failed to load orders.' });
      setOrders([]);
      setTotalSales(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (startDate && !endDate) newErrors.endDate = 'Please select an end date';
    if (endDate && !startDate) newErrors.startDate = 'Please select a start date';
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    fetchOrders();
  };

  const filteredOrders = orders.filter(
    (order) =>
      (order.id?.toString() || '').includes(searchQuery.toLowerCase()) ||
      (order.customerName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const sortTable = (column, direction) => {
    const sortedOrders = [...filteredOrders].sort((a, b) => {
      let valA = a[column];
      let valB = b[column];
      if (column === 'id' || column === 'totalAmount') {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
      } else if (column === 'dateCreated') {
        valA = new Date(valA);
        valB = new Date(valB);
      } else {
        valA = (valA || '').toLowerCase();
        valB = (valB || '').toLowerCase();
      }
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setOrders(sortedOrders);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const totalFilteredSales = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <div className="search-card">
            <div className="card-body">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="search-card">
          <div className="card-body">
            <h1 className="checkout-title">
              <span className="me-2">📋</span>Order Management Dashboard
            </h1>

            <div className="filter-form mb-4">
              <div className="row g-3 align-items-end">
                <div className="col-md-4">
                  <label htmlFor="startDate" className="form-label">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  {errors.startDate && <span className="error-message">{errors.startDate}</span>}
                </div>
                <div className="col-md-4">
                  <label htmlFor="endDate" className="form-label">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  {errors.endDate && <span className="error-message">{errors.endDate}</span>}
                </div>
                <div className="col-md-4">
                  <button
                    type="button"
                    className="btn-custom w-100"
                    style={{ backgroundColor: '#28a745', color: '#fff' }}
                    onClick={fetchOrders}
                  >
                    <span className="me-2">🔍</span>Apply Filters
                  </button>
                </div>
              </div>
            </div>

            <div className="search-container mb-4">
              <input
                type="text"
                id="searchBox"
                className="form-control"
                placeholder="Search by Order ID or Customer Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {errors.general && <div className="alert-danger mt-3">{errors.general}</div>}

            <div className="table-responsive">
              <table className="table">
                <thead>
                <tr>
                  <th onClick={() => sortTable('id', orders[0]?.sortDirection?.id === 'asc' ? 'desc' : 'asc')}>
                    Order ID
                  </th>
                  <th
                    onClick={() =>
                      sortTable('customerName', orders[0]?.sortDirection?.customerName === 'asc' ? 'desc' : 'asc')
                    }
                  >
                    Customer
                  </th>
                  <th
                    onClick={() =>
                      sortTable('totalAmount', orders[0]?.sortDirection?.totalAmount === 'asc' ? 'desc' : 'asc')
                    }
                  >
                    Total
                  </th>
                  <th
                    onClick={() =>
                      sortTable('dateCreated', orders[0]?.sortDirection?.dateCreated === 'asc' ? 'desc' : 'asc')
                    }
                  >
                    Date
                  </th>
                  <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order, index) => (
                    <tr key={order.id || index} className="fade-row visible" style={{ transitionDelay: `${index * 0.1}s` }}>
                      <td>#{order.id || 'N/A'}</td>
                      <td>{order.customerName || 'N/A'}</td>
                      <td style={{ color: '#28a745' }}>{(order.totalAmount || 0).toFixed(2)} PKR</td>
                      <td>
                        {order.dateCreated
                          ? new Date(order.dateCreated).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                          : 'N/A'}
                      </td>
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
                      No orders found.
                    </td>
                  </tr>
                )}
                </tbody>
              </table>
            </div>

            <div className="total-sales mt-3">
              Total Sales: <span style={{ color: '#28a745' }}>{totalFilteredSales.toFixed(2)} PKR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
// /*test
export default OrderList;
