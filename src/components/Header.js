import React, { useState, useRef, useEffect } from 'react';
import { Heart, Activity, Users, User, Menu, X, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = ({ currentView, onViewChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const profileDropdownRef = useRef(null);
  
  const navItems = [
    { id: 'detection', label: 'ตรวจจับอารมณ์', icon: Heart },
    { id: 'recommendations', label: 'กิจกรรมแนะนำ', icon: Activity },
    { id: 'community', label: 'ชุมชน', icon: Users }
  ];

  const handleNavClick = (itemId) => {
    onViewChange(itemId);
    setIsMobileMenuOpen(false);
  };

  const handleProfileClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleProfileAction = (action) => {
    if (action === 'profile') {
      onViewChange('profile');
    } else if (action === 'logout') {
      logout();
    }
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
          
          {/* Profile Dropdown */}
          <div className="profile-dropdown-container" ref={profileDropdownRef}>
            <button
              className={`nav-item profile-item ${currentView === 'profile' ? 'active' : ''}`}
              onClick={handleProfileClick}
            >
              <User className="nav-icon" />
              <span>โปรไฟล์</span>
              <ChevronDown className={`dropdown-arrow ${isProfileDropdownOpen ? 'open' : ''}`} />
            </button>
            
            {isProfileDropdownOpen && (
              <div className="profile-dropdown">
                <button
                  className="dropdown-item"
                  onClick={() => handleProfileAction('profile')}
                >
                  <Settings className="dropdown-icon" />
                  <span>ข้อมูลส่วนตัว</span>
                </button>
                <button
                  className="dropdown-item logout"
                  onClick={() => handleProfileAction('logout')}
                >
                  <LogOut className="dropdown-icon" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            )}
          </div>
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
          
          {/* Mobile Profile Options */}
          <button
            className={`nav-item ${currentView === 'profile' ? 'active' : ''}`}
            onClick={() => handleProfileAction('profile')}
          >
            <Settings className="nav-icon" />
            <span>ข้อมูลส่วนตัว</span>
          </button>
          
          <button
            className="nav-item logout"
            onClick={() => handleProfileAction('logout')}
          >
            <LogOut className="nav-icon" />
            <span>ออกจากระบบ</span>
          </button>
        </nav>
      )}
    </header>
  );
};

export default Header;
