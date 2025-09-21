import React, { useState } from 'react';
import { Heart, Activity, Users, User, Menu, X } from 'lucide-react';
import './Header.css';

const Header = ({ currentView, onViewChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navItems = [
    { id: 'detection', label: 'ตรวจจับอารมณ์', icon: Heart },
    { id: 'recommendations', label: 'กิจกรรมแนะนำ', icon: Activity },
    { id: 'community', label: 'ชุมชน', icon: Users },
    { id: 'profile', label: 'โปรไฟล์', icon: User }
  ];

  const handleNavClick = (itemId) => {
    onViewChange(itemId);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <Heart className="logo-icon" />
          <h1>MAI Mood Coach</h1>
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="menu-icon" /> : <Menu className="menu-icon" />}
        </button>
        
        {/* Desktop Navigation */}
        <nav className="nav desktop-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <nav className="nav mobile-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
};

export default Header;
