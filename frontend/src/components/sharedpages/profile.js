import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../context/ApiContext';
import { authAPI } from '../../services/api';
import Header from './header';
import Navbar from './navbar';
import Footer from './footer';
import './profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { getUserName, logout } = useApi();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile form data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: ''
  });
  
  // Password change data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Subscription upgrade states
  const [referralCode, setReferralCode] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  // User data from database
  const [userProfile, setUserProfile] = useState({
    currentPlan: 'Free',
    subscriptionPeriod: 'monthly',
    subscriptionStartDate: null,
    accountCreatedDate: null,
    lastLogin: null,
    subscriptionStatus: 'active',
    isActive: true
  });

  // Load user profile data from database when component mounts
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoadingProfile(true);
        setApiError('');
        
        // Check if user has JWT token
        const accessToken = localStorage.getItem('accessToken');
        
        if (!accessToken) {
          setApiError('No authentication token found. Please login again.');
          return;
        }
        
        // Fetch profile from backend using JWT token
        const profileResponse = await authAPI.getProfile();
        console.log('Profile API response:', profileResponse);
        console.log('User type from API:', profileResponse.user_type);
        
        // Update form data with database values
        setFormData({
          fullName: profileResponse.full_name || '',
          email: profileResponse.email || '',
          phoneNumber: profileResponse.phone_number || ''
        });
        
        // Update user profile data
        let currentPlan = 'Free';
        if (profileResponse.user_type === 'premium') {
          currentPlan = 'Premium';
        } else if (profileResponse.user_type === 'agent') {
          currentPlan = 'Agent';
        } else if (profileResponse.user_type === 'admin') {
          currentPlan = 'System Admin';
        }
        
        console.log('Setting current plan to:', currentPlan);
        console.log('User type comparison:', {
          isPremium: profileResponse.user_type === 'premium',
          isAgent: profileResponse.user_type === 'agent',
          isAdmin: profileResponse.user_type === 'admin',
          userType: profileResponse.user_type
        });
        
        setUserProfile({
          currentPlan: currentPlan,
          subscriptionPeriod: 'monthly', // Default, can be enhanced later
          subscriptionStartDate: profileResponse.subscription_start_date ? new Date(profileResponse.subscription_start_date) : null,
          accountCreatedDate: profileResponse.account_created_date ? new Date(profileResponse.account_created_date) : null,
          lastLogin: profileResponse.last_login ? new Date(profileResponse.last_login) : null,
          subscriptionStatus: profileResponse.subscription_status || 'active',
          isActive: profileResponse.is_active
        });
        
      } catch (error) {
        console.error('Error loading user profile:', error);
        setApiError(error.message || 'Failed to load profile data');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setApiError('');
    setSuccessMessage('');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    setApiError('');
    setSuccessMessage('');
  };
  
  const handleReferralCodeChange = (e) => {
    setReferralCode(e.target.value);
    setApiError('');
  };
  
  const handlePlanSelection = (e) => {
    setSelectedPlan(e.target.value);
    setApiError('');
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwordData.currentPassword.trim()) {
      setApiError('Please enter your current password!');
      return;
    }
    if (!passwordData.newPassword.trim()) {
      setApiError('Please enter a new password!');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setApiError('New passwords do not match!');
      return;
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      setApiError('New password must be different from your current password!');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setApiError('New password must be at least 6 characters long!');
      return;
    }

    try {
    setIsLoading(true);
      setApiError('');
      setSuccessMessage('');
      
      // Call backend API using JWT token
      await authAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      setSuccessMessage('Password changed successfully!');
        
        // Reset password form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
      } catch (error) {
        console.error('Error changing password:', error);
      setApiError(error.message || 'Failed to change password');
    } finally {
        setIsLoading(false);
      }
  };

  const handleSaveChanges = async () => {
    try {
    setIsLoading(true);
      setApiError('');
      setSuccessMessage('');
      
      // Prepare profile data for update (no email needed with JWT)
      const profileData = {
        full_name: formData.fullName,
        phone_number: formData.phoneNumber
      };
      
      // Call backend API
      const response = await authAPI.updateProfile(profileData);
      
      setSuccessMessage('Profile updated successfully! Your changes have been saved.');
      
      // Update local state with new data from database
      setFormData(prev => ({
        ...prev,
        fullName: response.user.full_name,
        phoneNumber: response.user.phone_number
      }));
      
      } catch (error) {
        console.error('Error saving profile data:', error);
      setApiError(error.message || 'Failed to save profile data');
    } finally {
        setIsLoading(false);
      }
  };

  const handleCancel = () => {
    // Reload profile data from database to reset form
    window.location.reload();
  };

  const handleManageSubscription = () => {
    setShowSubscriptionModal(true);
  };

  const handleCloseSubscriptionModal = () => {
    setShowSubscriptionModal(false);
  };

  const handleUpgradePlan = async () => {
    try {
      setIsUpgrading(true);
      setApiError('');
      setSuccessMessage('');
      
      // Validate plan selection
      if (!selectedPlan) {
        setApiError('Please select a plan (monthly or yearly)');
        return;
      }
      
      // Prepare upgrade data
      const upgradeData = {
        plan: selectedPlan,
        referralCode: referralCode.trim() || null
      };
      
      console.log('Upgrading with data:', upgradeData);
      
      // Call backend API to upgrade with plan and referral code
      const response = await authAPI.upgradeToPremium(upgradeData);
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        currentPlan: 'Premium',
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        subscriptionPeriod: selectedPlan
      }));
      
      // Update userType in localStorage for navigation purposes
      localStorage.setItem('userType', 'premium');
      
      setSuccessMessage(`Successfully upgraded to Premium ${selectedPlan} plan! Redirecting to dashboard...`);
      setShowSubscriptionModal(false);
      
      // Reset form
      setReferralCode('');
      setSelectedPlan('monthly');
      
      // Redirect to dashboard after a short delay to show success message
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      setApiError(error.message || 'Failed to upgrade to premium');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleDowngradePlan = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel your Premium subscription? You will lose access to premium features and be moved to the Free plan. This action cannot be undone.'
    );
    
    if (confirmed) {
      try {
        setIsLoading(true);
        setApiError('');
        setSuccessMessage('');
        
        // Call backend API to downgrade (no email needed with JWT)
        const response = await authAPI.downgradeToFree();
        
        // Update local state
        setUserProfile(prev => ({
          ...prev,
          currentPlan: 'Free',
          subscriptionStatus: 'inactive',
          subscriptionStartDate: null
        }));
        
        // Update userType in localStorage for navigation purposes
        localStorage.setItem('userType', 'free');
        
        setSuccessMessage('Successfully downgraded to Free plan! Redirecting to dashboard...');
      setShowSubscriptionModal(false);
        
        // Redirect to dashboard after a short delay to show success message
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
        
      } catch (error) {
        console.error('Error downgrading to free:', error);
        setApiError(error.message || 'Failed to downgrade to free');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeactivateAccount = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This action will deactivate your account. You will not be able to log in with this account. To reactivate, you will need to sign up again with a new account.\n\nAre you sure you want to proceed?'
    );
    
    if (confirmed) {
      try {
      setIsLoading(true);
        setApiError('');
        
        // Call backend API to deactivate own account
        await authAPI.deactivateOwnAccount();
        
        // Show deactivation confirmation
        alert('Your account has been deactivated. You will be logged out. You can sign up again with the same email address to create a new account.');
        
        // Logout and clear user data, redirect to landing page
        logout('/');
        
      } catch (error) {
        console.error('Error deactivating account:', error);
        setApiError(error.message || 'Failed to deactivate account');
        setIsLoading(false);
      }
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="user-dashboard">
        <Header />
        <div className="user-dashboard-container">
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="user-main-content">
            <div className="profile-loading">
              <p>Loading profile data...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      {/* Top Header */}
      <Header />

      <div className="user-dashboard-container">
        {/* Left Sidebar */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content */}
        <main className="user-main-content">
          <h1 className="profile-section-title">Profile</h1>
          
          {/* Error and Success Messages */}
          {apiError && (
            <div className="profile-error-message">
              {apiError}
              <button 
                className="profile-clear-error-btn"
                onClick={() => setApiError('')}
              >
                ×
              </button>
            </div>
          )}
          
          {successMessage && (
            <div className="profile-success-message">
              {successMessage}
              <button 
                className="profile-clear-success-btn"
                onClick={() => setSuccessMessage('')}
              >
                ×
              </button>
            </div>
          )}
          
          {/* Personal Information */}
          <section className="profile-section">
            <h2 className="profile-subsection-title">Personal Information</h2>
            <div className="profile-form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                disabled={isLoading}
              />
            </div>
            <div className="profile-form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                disabled={true}
                className="profile-disabled-input"
                title="Email cannot be changed"
              />
            </div>
            <div className="profile-form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                disabled={isLoading}
              />
            </div>
          </section>

          {/* Change Password */}
          <section className="profile-section">
            <h2 className="profile-subsection-title">Change Password</h2>
            <div className="profile-form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
                disabled={isLoading}
              />
            </div>
            <div className="profile-form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
                disabled={isLoading}
              />
            </div>
            <div className="profile-form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
                disabled={isLoading}
              />
            </div>
            <button 
              className="profile-change-password-btn"
              onClick={handleChangePassword}
              disabled={isLoading}
            >
              {isLoading ? 'Changing Password...' : 'Change Password'}
            </button>
          </section>

          {/* Account Information */}
          <section className="profile-section">
            <h2 className="profile-subsection-title">Account Information</h2>
            <div className="profile-account-info">
              <div className="profile-info-item">
                <span className="profile-info-label">Account Created:</span>
                <span className="profile-info-value">{formatDate(userProfile.accountCreatedDate)}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Last Login:</span>
                <span className="profile-info-value">{formatDate(userProfile.lastLogin)}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Account Status:</span>
                <span className={`profile-info-value ${userProfile.isActive ? 'active' : 'inactive'}`}>
                  {userProfile.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </section>

          {/* Subscription */}
          <section className="profile-section">
            <h2 className="profile-subsection-title">Subscription</h2>
            <div className="profile-subscription-info">
              <div className="profile-info-item">
                <span className="profile-info-label">Current Plan:</span>
                <span className={`profile-info-value ${userProfile.currentPlan.toLowerCase()}`}>
                  {userProfile.currentPlan}
                </span>
              </div>
              {userProfile.currentPlan === 'Premium' && (
                <div className="profile-info-item">
                  <span className="profile-info-label">Subscription Status:</span>
                  <span className={`profile-info-value ${userProfile.subscriptionStatus}`}>
                    {userProfile.subscriptionStatus}
                  </span>
                </div>
              )}
              {userProfile.currentPlan === 'Premium' && userProfile.subscriptionStartDate && (
                <div className="profile-info-item">
                  <span className="profile-info-label">Subscription Start:</span>
                  <span className="profile-info-value">
                    {formatDate(userProfile.subscriptionStartDate)}
                  </span>
                </div>
              )}
              <p className="profile-subscription-description">
                {userProfile.currentPlan === 'Premium' && 'Enjoy exclusive access to advanced search filters, detailed property reports, and personalized alerts with your Premium plan.'}
                {userProfile.currentPlan === 'Agent' && 'You have access to agent-specific features including property management, client interactions, and specialized tools for real estate professionals.'}
                {userProfile.currentPlan === 'System Admin' && 'You have administrative access to manage the system, users, and platform settings.'}
                {userProfile.currentPlan === 'Free' && 'Basic access to property listings. Upgrade to unlock advanced features and detailed reports.'}
              </p>
              
              {/* Show subscription management for all user types */}
              <button 
                className="profile-manage-subscription-btn"
                onClick={handleManageSubscription}
              >
                {userProfile.currentPlan === 'Premium' ? 'Manage Subscription' : 
                 userProfile.currentPlan === 'Free' ? 'Upgrade to Premium' : 'Subscription Options'}
              </button>
            </div>
          </section>

          {/* Account Settings */}
          <section className="profile-section">
            <h2 className="profile-subsection-title">Account Management</h2>
            <button 
              className="profile-deactivate-account-btn"
              onClick={handleDeactivateAccount}
              disabled={isLoading}
            >
              {isLoading ? 'Deactivating...' : 'Deactivate My Account'}
            </button>
          </section>

          {/* Action Buttons */}
          <div className="profile-action-buttons">
            <button 
              className="profile-cancel-btn"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              className="profile-save-btn"
              onClick={handleSaveChanges}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </main>
      </div>

      {/* Subscription Management Modal */}
      {showSubscriptionModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal">
            <div className="profile-modal-header">
              <h3>Manage Subscription</h3>
              <button 
                className="profile-modal-close-btn"
                onClick={handleCloseSubscriptionModal}
              >
                ×
              </button>
            </div>
            <div className="profile-modal-content">
              <div className="profile-modal-section">
                <h4>Current Plan: {userProfile.currentPlan}</h4>
                <p>
                  {userProfile.currentPlan === 'Premium' && 'You currently have a Premium subscription with access to advanced features.'}
                  {userProfile.currentPlan === 'Agent' && 'You currently have an Agent account with access to professional real estate tools and features.'}
                  {userProfile.currentPlan === 'System Admin' && 'You currently have System Administrator access with full platform control.'}
                  {userProfile.currentPlan === 'Free' && 'You currently have a Free plan with basic access to property listings.'}
                </p>
              </div>

              {userProfile.currentPlan === 'Premium' ? (
                <div className="profile-modal-section">
                  <h4>Cancel Premium Subscription</h4>
                  <p>Cancel your Premium subscription to return to the Free plan.</p>
                  <button 
                    className="profile-modal-downgrade-btn"
                    onClick={handleDowngradePlan}
                  >
                    Cancel Premium
                  </button>
                </div>
              ) : userProfile.currentPlan === 'Free' ? (
                <div className="profile-modal-section">
                  <h4>Upgrade to Premium</h4>
                  <p>Get access to advanced search filters, detailed reports, and personalized alerts.</p>
                  
                  {/* Referral Code Input */}
                  <div className="profile-referral-section">
                    <label htmlFor="referralCode">Referral Code (Optional):</label>
                    <input
                      type="text"
                      id="referralCode"
                      value={referralCode}
                      onChange={handleReferralCodeChange}
                      placeholder="Enter referral code for discount"
                      className="profile-referral-input"
                    />
                  </div>
                  
                  {/* Payment Options */}
                  <div className="profile-payment-options">
                    <h5>Choose Your Plan:</h5>
                    <div className="profile-plan-option">
                      <input 
                        type="radio" 
                        id="monthly" 
                        name="plan" 
                        value="monthly" 
                        checked={selectedPlan === 'monthly'}
                        onChange={handlePlanSelection}
                      />
                      <label htmlFor="monthly">Monthly - $19.99/month</label>
                    </div>
                    <div className="profile-plan-option">
                      <input 
                        type="radio" 
                        id="yearly" 
                        name="plan" 
                        value="yearly" 
                        checked={selectedPlan === 'yearly'}
                        onChange={handlePlanSelection}
                      />
                      <label htmlFor="yearly">Yearly - $199.99/year (Save 17%)</label>
                    </div>
                  </div>
                  
                  <button 
                    className="profile-modal-upgrade-btn"
                    onClick={handleUpgradePlan}
                    disabled={isUpgrading}
                  >
                    {isUpgrading ? 'Upgrading...' : 'Upgrade to Premium'}
                  </button>
                </div>
              ) : (
                <div className="profile-modal-section">
                  <h4>Professional Account</h4>
                  <p>
                    {userProfile.currentPlan === 'Agent' && 'You have a professional Agent account with access to specialized real estate tools and features.'}
                    {userProfile.currentPlan === 'System Admin' && 'You have System Administrator access with full platform control and management capabilities.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Profile;
