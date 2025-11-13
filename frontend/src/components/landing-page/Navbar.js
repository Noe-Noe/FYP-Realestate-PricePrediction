import React, { useState, useEffect } from 'react';
import './Navbar.css';
import logo from '../../logo.png';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Function to toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Function to close mobile menu when clicking on a link
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Function to handle navigation
  const handleNavigation = (e, path) => {
    e.preventDefault();
    closeMobileMenu();
    
    if (path === '/') {
      // If going to home, navigate to landing page
      window.location.href = '/';
    } else if (path.startsWith('/#')) {
      // If it's a hash link and we're not on the landing page, go to landing page first
      if (window.location.pathname !== '/') {
        window.location.href = path;
      } else {
        // If we're already on landing page, scroll to section
        const sectionId = path.substring(2); // Remove '/#' to get section id
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      // For other paths, navigate normally
      window.location.href = path;
    }
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.navbar-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img src={logo} alt="valuez logo" className="logo-img" />
            <span className="logo-text">valuez</span>
          </a>
        </div>
        
        {/* Mobile menu toggle */}
        <button 
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}></span>
        </button>
        
        {/* Desktop navigation menu */}
        <ul className={`navbar-menu ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <li><a href="/" onClick={(e) => handleNavigation(e, '/')}>Home</a></li>
          <li><a href="/#howitworks" onClick={(e) => handleNavigation(e, '/#howitworks')}>Explore</a></li>
          <li><a href="/#plans" onClick={(e) => handleNavigation(e, '/#plans')}>Subscription Plans</a></li>
          <li><a href="/#faq" onClick={(e) => handleNavigation(e, '/#faq')}>FAQ</a></li>
          <li><a href="/#reviews" onClick={(e) => handleNavigation(e, '/#reviews')}>Reviews</a></li>
        </ul>
        
        {/* Login/Register button */}
        <div className="navbar-actions">
          <a href="/login" className="btn btn-primary">Login / Register</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
