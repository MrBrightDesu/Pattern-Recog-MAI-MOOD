import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import './ErrorPopup.css';

function ErrorPopup({ isOpen, onClose, title, message, type = 'error' }) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="error-icon" />;
      case 'warning':
        return <AlertCircle className="warning-icon" />;
      case 'success':
        return <AlertCircle className="success-icon" />;
      default:
        return <AlertCircle className="error-icon" />;
    }
  };

  const getTitleColor = () => {
    switch (type) {
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'success':
        return '#10b981';
      default:
        return '#ef4444';
    }
  };

  return (
    <div className="error-popup-overlay" onClick={onClose}>
      <div className="error-popup" onClick={(e) => e.stopPropagation()}>
        <div className="error-popup-header">
          <div className="error-popup-title" style={{ color: getTitleColor() }}>
            {getIcon()}
            <span>{title}</span>
          </div>
          <button
            className="error-popup-close"
            onClick={onClose}
            title="ปิด"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="error-popup-content">
          <p className="error-popup-message">{message}</p>
        </div>
        
        <div className="error-popup-footer">
          <button
            className="error-popup-button"
            onClick={onClose}
          >
            ตกลง
          </button>
        </div>
      </div>
    </div>
  );
}

export default ErrorPopup;
