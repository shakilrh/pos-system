import React from 'react';
import Sidebar from './Sidebar';

const Dashboard = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="bg-white rounded shadow-sm p-4">
          <h2 className="fw-bold mb-3 text-primary">Welcome 👋</h2>
          <p className="text-muted">Use the sidebar menu to navigate through different sections of your POS system.</p>
          {/* You can insert graphs, stats, recent orders etc. here */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
// /*test
