import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const getProducts = () => api.get('/store/products');
export const getInventory = () => api.get('/store/products');
export const getProductByBarcode = (barcode) =>
  api.get(`/order/getProductByBarcode/${barcode}`);
export const saveOrder = (data) => api.post('/order/saveOrder', data);
export const getOrderDetails = (id) => api.get(`/order/orderDetails/${id}`);
export const listOrders = (startDate, endDate) =>
  api.get('/order/listOrders', { params: { startDate, endDate } });
export const searchCustomerOrders = (customerName) =>
  api.get('/order/searchCustomerOrders', { params: { customerName } });
export const addPayment = (data) => api.post('/order/addPayment', data);
export const getOrdersOverTime = () => api.get('/order/ordersOverTime');

// Role Management APIs
export const getUsers = () => api.get('/role-management/users');
export const createUser = (data) => api.post('/role-management/users', data);
export const updateUser = (id, data) => api.put(`/role-management/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/role-management/users/${id}`);
export const getRoles = () => api.get('/role-management/roles');
export const createRole = (data) => api.post('/role-management/roles', data);
export const updateRole = (id, data) => api.put(`/role-management/roles/${id}`, data);
export const deleteRole = (id) => api.delete(`/role-management/roles/${id}`);
export const assignRole = (data) => api.post('/role-management/assign-role', data);
export const getPermissions = () => api.get('/role-management/permissions');
export const assignPermissions = (data) => api.post('/role-management/permissions', data);

// Fetch user permissions
export const getUserPermissions = () => api.get('/role-management/user-permissions');

export default api;
