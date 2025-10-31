import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../context/ApiContext';
import './header.css';
import logo from '../../logo.png';

const Header = () => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const navigate = useNavigate();
  const { logout, getUserName } = useApi();

  const handleProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleProfilePage = () => {
    setShowProfileDropdown(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    setShowProfileDropdown(false);
    // Use the proper logout function from API context which redirects to landing page
    logout('/');
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest('.header-user-profile')) {
      setShowProfileDropdown(false);
    }
  };

  // Add click listener to close dropdown when clicking outside
  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <header className="header-dashboard-header">
      <div className="header-center">
        <div className="header-logo">
          <img 
            src={logo} 
            alt="Valuez Logo" 
            className="header-logo-icon"
            width="32"
            height="32"
          />
          <span className="header-logo-text">Valuez</span>
        </div>
      </div>
      <div className="header-right">
        <div className="header-user-profile">
          {/* Show profile image only if user has one, otherwise show initials */}
          <div 
            className="header-profile-image"
            onClick={handleProfileClick}
          >
            {/* 
              TODO: Future enhancement - Add profile image support
              {userProfileImage ? (
                <img 
                  src={userProfileImage} 
                  alt="User Profile" 
                  className="header-profile-image-img"
                />
              ) : (
                <span className="header-profile-initials">
                  {getUserName() ? getUserName().charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            */}
            <span className="header-profile-initials">
              {getUserName() ? getUserName().charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          {showProfileDropdown && (
            <div className="header-profile-dropdown">
              <div className="header-dropdown-item" onClick={handleProfilePage}>
                <span className="header-dropdown-icon">👤</span>
                <span>Profile</span>
              </div>
              <div className="header-dropdown-divider"></div>
              <div className="header-dropdown-item" onClick={handleLogout}>
                <span className="header-dropdown-icon">🚪</span>
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
