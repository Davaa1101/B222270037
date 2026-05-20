import React, { useState } from 'react';

const Alert = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(onClose, 300); // Allow animation to complete
    }
  };

  if (!isVisible) return null;

  const getAlertClass = () => {
    switch (type) {
      case 'success':
        return 'alert-success';
      case 'error':
      case 'danger':
        return 'alert-danger';
      case 'warning':
        return 'alert-warning';
      case 'info':
        return 'alert-info';
      default:
        return 'alert-primary';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
      case 'danger':
        return 'fas fa-exclamation-triangle';
      case 'warning':
        return 'fas fa-exclamation-circle';
      case 'info':
        return 'fas fa-info-circle';
      default:
        return 'fas fa-info-circle';
    }
  };

  return (
    <div 
      className={`alert ${getAlertClass()} alert-dismissible fade show d-flex align-items-center`} 
      role="alert"
      style={{
        animation: 'slideDown 0.3s ease-out',
        borderRadius: '8px',
        border: 'none',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}
    >
      <i className={`${getIcon()} me-2`}></i>
      <div className="flex-grow-1">{message}</div>
      <button
        type="button"
        className="btn-close"
        aria-label="Close"
        onClick={handleClose}
        style={{ fontSize: '0.8rem' }}
      ></button>
      

    </div>
  );
};

export default Alert;