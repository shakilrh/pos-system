import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import RegisterStep1 from './components/RegisterStep1';
import RegisterStep2 from './components/RegisterStep2';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Checkout from './components/Checkout';
import OrderList from './components/OrderList';
import OrderDetails from './components/OrderDetails';
import ThemeSelector from './components/ThemeSelector';
import CustomerOrders from './components/CustomerOrders';
import RoleManagement from './components/RoleManagement';
import NotAuthorized from './components/NotAuthorized';
import ErrorBoundary from './components/ErrorBoundary'; // Added import

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary> {/* Wrap with ErrorBoundary */}
          <Routes>
            <Route path="/register-step1" element={<RegisterStep1 />} />
            <Route path="/register-step2" element={<RegisterStep2 />} />
            <Route path="/login" element={<Login />} />
            <Route element={<MainLayout />}>
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredPage="dashboard">
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute requiredPage="inventory">
                    <Inventory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute requiredPage="checkout">
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute requiredPage="listOrders">
                    <OrderList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order-details/:id"
                element={
                  <ProtectedRoute requiredPage="orderDetails">
                    <OrderDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/role-management"
                element={
                  <ProtectedRoute requiredPage="roleManagement">
                    <RoleManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/theme-selector"
                element={
                  <ProtectedRoute requiredPage="themeSelector">
                    <ThemeSelector />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer-orders"
                element={
                  <ProtectedRoute requiredPage="customerOrders">
                    <CustomerOrders />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="/" element={<Login />} />
            <Route path="/not-authorized" element={<NotAuthorized />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
