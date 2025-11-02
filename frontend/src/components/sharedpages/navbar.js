import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../context/ApiContext';
import './navbar.css';

const Navbar = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const { logout } = useApi();

  // Get user type from localStorage
  const userType = localStorage.getItem('userType') || 'free';

  // Define navigation items based on user type
  const getNavigationItems = () => {
    if (userType === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
        { id: 'user-accounts', label: 'User Accounts', icon: '👥' },
        { id: 'feedback', label: 'Feedback', icon: '💬' },
        { id: 'content', label: 'Content', icon: '📄' },
        { id: 'regions', label: 'Regions', icon: '📍' }
      ];
    } else if (userType === 'agent') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
        { id: 'listings', label: 'Listings', icon: '🏢' },
        { id: 'regions', label: 'Regions', icon: '📍' },
        { id: 'support', label: 'Support', icon: '❓' },
        { id: 'feedback', label: 'Feedback', icon: '💬' },
        { id: 'profile', label: 'Profile', icon: '👤' }
      ];
    } else {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
        { id: 'price-prediction', label: 'Price Prediction', icon: '📈' },
        ...(userType === 'premium' ? [{ id: 'compare-predictions', label: 'Compare Predictions', icon: '🔄' }] : []),
        { id: 'property-listings', label: 'Property Listings', icon: '🏢' },
        { id: 'bookmarks', label: 'Bookmarks', icon: '🔖' },
        { id: 'support', label: 'Support', icon: '❓' },
        { id: 'feedback', label: 'Feedback', icon: '💬' },
        { id: 'profile', label: 'Profile', icon: '👤' }
      ];
    }
  };

  const navigationItems = getNavigationItems();

  const handleLogout = () => {
    // Use the proper logout function from API context which redirects to landing page
    logout('/');
  };

  const handleNavigation = (itemId) => {
    console.log('Navigation clicked:', itemId, 'User type:', userType);
    if (typeof setActiveTab === 'function') {
      setActiveTab(itemId);
    } else {
      console.error('setActiveTab is not a function:', setActiveTab);
    }
    
    if (userType === 'admin') {
      // System Admin navigation
      switch (itemId) {
        case 'dashboard':
          console.log('Navigating to dashboard/sysadmin');
          navigate('/dashboard/sysadmin');
          break;
        case 'user-accounts':
          console.log('Navigating to dashboard/user-accounts');
          navigate('/dashboard/user-accounts');
          break;
        case 'feedback':
          console.log('Navigating to dashboard/feedback-management');
          navigate('/dashboard/feedback-management');
          break;
        case 'content':
          console.log('Navigating to dashboard/content-management');
          navigate('/dashboard/content-management');
          break;
        case 'regions':
          console.log('Navigating to dashboard/regions-management');
          navigate('/dashboard/regions-management');
          break;
        default:
          break;
      }
    } else if (userType === 'agent') {
      // Agent-specific navigation
      switch (itemId) {
        case 'dashboard':
          navigate('/dashboard');
          break;
        case 'listings':
          navigate('/dashboard/listings');
          break;
        case 'regions':
          navigate('/dashboard/regions');
          break;
        case 'support':
          navigate('/support');
          break;
        case 'feedback':
          navigate('/feedback');
          break;
        case 'profile':
          navigate('/profile');
          break;
        default:
          break;
      }
    } else {
      // Free/Premium user navigation
      switch (itemId) {
        case 'dashboard':
          navigate('/dashboard/registered');
          break;
        case 'price-prediction':
          navigate('/dashboard/priceprediction');
          break;
        case 'compare-predictions':
          navigate('/dashboard/compare-predictions');
          break;
        case 'property-listings':
          navigate('/dashboard/property-listings');
          break;
        case 'bookmarks':
          navigate('/bookmarks');
          break;
        case 'support':
          navigate('/support');
          break;
        case 'feedback':
          navigate('/feedback');
          break;
        case 'profile':
          navigate('/profile');
          break;
        default:
          break;
      }
    }
  };

  return (
    <aside className="navbar-sidebar">
      <nav className="navbar-sidebar-nav">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            className={`navbar-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => handleNavigation(item.id)}
          >
            <span className="navbar-nav-icon">{item.icon}</span>
            <span className="navbar-nav-label">{item.label}</span>
          </button>
        ))}
        <div className="navbar-nav-divider"></div>
        <button className="navbar-nav-item navbar-logout-item" onClick={handleLogout}>
          <span className="navbar-nav-icon">🚪</span>
          <span className="navbar-nav-label">Logout</span>
        </button>
      </nav>
    </aside>
  );
};

export default Navbar;
