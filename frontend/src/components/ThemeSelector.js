import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { Modal, Button } from 'react-bootstrap';
import '../styles/theme.css';
import './ThemeSelector.css';

const ThemeSelector = () => {
  const { theme, switchTheme, validThemes } = useContext(ThemeContext);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const themeNames = {
    'default': 'Default Theme',
    'dark': 'Dark Theme',
    'blue-ocean': 'Blue Ocean Theme',
    'warm-sunset': 'Warm Sunset Theme',
    'forest-mist': 'Forest Mist Theme',
    'twilight-glow': 'Twilight Glow Theme',
  };
// /*test
  const handleThemeClick = (themeName) => {
    if (themeName !== theme) {
      setSelectedTheme(themeName);
      setShowModal(true);
    }
  };

  const handleConfirmTheme = () => {
    switchTheme(selectedTheme);
    setShowModal(false);
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000); // Delay to show banner
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTheme(null);
  };

  return (
    <div className="container mt-5">
      <div className="header">
        <h1>
          <i className="fas fa-palette fa-2x me-3"></i> Select a Theme
        </h1>
      </div>

      <div className="theme-grid">
        {validThemes.map((themeName) => (
          <div
            key={themeName}
            className={`theme-card theme-${themeName} ${theme === themeName ? 'active' : ''}`}
            onClick={() => handleThemeClick(themeName)}
          >
            <h3 className="theme-title">{themeNames[themeName]}</h3>
          </div>
        ))}
      </div>

      <div
        className="active-theme-banner"
        style={{ display: theme ? 'block' : 'none' }}
      >
        Active Theme: <span>{themeNames[theme]}</span>
      </div>

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Theme Change</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to switch to the{' '}
          <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
            {selectedTheme ? themeNames[selectedTheme] : ''}
          </span>{' '}
          theme?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            No
          </Button>
          <Button className="btn-confirm" onClick={handleConfirmTheme}>
            Yes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ThemeSelector;
