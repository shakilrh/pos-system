import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const RegisterStep1 = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for password visibility toggle
  const navigate = useNavigate();

  const handleNext = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/register-step1', { username, email, password });
      if (response.data.success) {
        navigate('/register-step2', { state: { tempToken: response.data.tempToken, username, password, email } });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error during registration');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="container login-container fade-in">
      <div className="row">
        {/* Left Section (Description and Features) */}
        <div className="col-md-6 left-section">
          <div className="logo">Smart POS System</div>
          <h2>Energize your Business!</h2>
          <p>Step 1: Enter your account details to get started</p>
        </div>

        {/* Right Section (Registration Form - Step 1) */}
        <div className="col-md-6 d-flex justify-content-center align-items-center right-section">
          <div className="login-card w-100">
            <h3 className="mb-4">Register - Step 1</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleNext}>
              <div className="mb-4">
                <label htmlFor="username" className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                />
              </div>
              <div className="mb-4 position-relative">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
                <span
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                >
                  <i className={`bi ${showPassword ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                </span>
              </div>
              <button type="submit" className="btn btn-primary">NEXT</button>
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

        .password-toggle {
          position: absolute;
          top: 70%;
          right: 15px;
          transform: translateY(-50%);
          cursor: pointer;
          color: #666;
          z-index: 10;
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

export default RegisterStep1;
