import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const RegisterStep2 = () => {
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { tempToken, username, password, email } = location.state || {};

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!tempToken || !username || !password || !email) {
      setError('Missing registration data. Please start over.');
      return;
    }

    try {
      await api.post('/auth/register-step2', { tempToken, businessName, phone, address });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="container login-container fade-in">
      <div className="row">
        {/* Left Section (Description and Features) */}
        <div className="col-md-6 left-section">
          <div className="logo">Smart POS System</div>
          <h2>Energize your Business!</h2>
          <p>Step 2: Provide your business details to complete registration</p>
        </div>

        {/* Right Section (Registration Form - Step 2) */}
        <div className="col-md-6 d-flex justify-content-center align-items-center right-section">
          <div className="login-card w-100">
            <h3 className="mb-4">Register - Step 2</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleRegister}>
              <div className="mb-4">
                <label htmlFor="businessName" className="form-label">Business Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Business Name"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="phone" className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="address" className="form-label">Address</label>
                <input
                  type="text"
                  className="form-control"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Address"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">REGISTER</button>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        body {
          background-color: #f8f9fa;
          font-family: Arial, sans-serif;
        }

        .login-container {
          max-width: 1200px;
          margin: 50px auto;
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 40px;
        }

        .left-section {
          padding: 40px;
          background-color: #f8f9fa;
          border-radius: 10px 0 0 10px;
          color: #333;
        }

        .right-section {
          padding: 40px;
          background-color: #fff;
          border-radius: 0 10px 10px 0;
        }

        .form-label {
          font-weight: bold;
          color: #333;
        }

        .form-control {
          border-radius: 8px;
          border: 2px solid #ced4da;
          padding: 16px 40px 16px 16px;
          font-size: 1.2rem;
          background-color: #f0f8ff;
          transition: 0.3s;
          width: 100%;
        }

        .form-control:focus {
          border-color: #007bff;
          box-shadow: 0 0 8px rgba(0, 123, 255, 0.3);
        }

        .btn-primary {
          background-color: #28a745;
          border-color: #28a745;
          font-weight: bold;
          padding: 14px 30px;
          font-size: 1.2rem;
          border-radius: 8px;
          width: 100%;
        }

        .btn-primary:hover {
          background-color: #218838;
          border-color: #218838;
        }

        .logo {
          font-size: 2.5rem;
          color: #1a2b49;
          font-weight: bold;
          margin-bottom: 20px;
        }

        .fade-in {
          animation: fadeIn 1.5s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .login-container {
            margin: 20px;
          }

          .row {
            flex-direction: column;
          }

          .left-section, .right-section {
            border-radius: 10px;
            padding: 20px;
          }

          .form-control, .btn-primary {
            font-size: 1rem;
            padding: 12px;
          }

          .btn-primary {
            padding: 12px 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default RegisterStep2;
