import React from 'react';
import { Link } from 'react-router-dom';

const NotAuthorized = () => {
  return (
    <div className="container mt-5 text-center">
      <h1>Not Authorized</h1>
      <p>You do not have permission to access this page.</p>
      <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
    </div>
  );
};

export default NotAuthorized;
// /*test
