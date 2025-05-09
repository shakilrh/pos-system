import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="d-flex min-vh-100">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-grow-1 d-flex flex-column">
        <header className="bg-white border-bottom p-3 d-md-none d-flex justify-content-between align-items-center shadow-sm">
          <button className="btn btn-light" onClick={toggleSidebar}>
            <i className="bi bi-list"></i>
          </button>
          <h5 className="mb-0 text-primary fw-bold">POS Dashboard</h5>
        </header>
        <main className="flex-grow-1 p-4 bg-light">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
// /*test
export default MainLayout;
