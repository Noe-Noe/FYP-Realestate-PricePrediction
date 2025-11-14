import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApi } from '../../context/ApiContext';
import { authAPI } from '../../services/api';
import { BACKEND_ORIGIN } from '../../services/api';
import Header from './header';
import Navbar from './navbar';
import Footer from './footer';
import './profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getUserName, logout } = useApi();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile form data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: ''
  });
  
  // Agent-specific form data
  const [agentFormData, setAgentFormData] = useState({
    ceaNumber: '',
    agentCompany: '',
    companyPhoneNumber: '',
    companyEmail: '',
    specializations: [], // Array of selected property type specializations
    registrationStartDate: ''
  });

  // Property types for specialization (same as price prediction)
  const propertyTypes = [
    'Office',
    'Retail',
    'Shop House',
    'Single-user Factory',
    'Multiple-user Factory',
    'Warehouse',
    'Business Parks'
  ];
  
  // License picture state
  const [licensePicture, setLicensePicture] = useState(null);
  const [licensePictureUrl, setLicensePictureUrl] = useState('');
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  
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
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Subscription upgrade states
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  // Payment form data
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardName: ''
  });
  
  // Payment form errors
  const [paymentErrors, setPaymentErrors] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardName: ''
  });
  
  // User data from database
  const [userProfile, setUserProfile] = useState({
    currentPlan: 'Free',
    subscriptionPeriod: 'monthly',
    subscriptionStartDate: null,
    accountCreatedDate: null,
    lastLogin: null,
    subscriptionStatus: 'active',
    isActive: true,
    userType: 'free'
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
        
        // Load agent information if user is an agent
        if (profileResponse.user_type === 'agent') {
          try {
            // Fetch agent profile data
            const agentProfileResponse = await authAPI.getAgentProfile();
            if (agentProfileResponse) {
              // Handle specializations - ensure it's an array
              let specializations = [];
              if (agentProfileResponse.specializations) {
                if (Array.isArray(agentProfileResponse.specializations)) {
                  specializations = agentProfileResponse.specializations;
                } else if (typeof agentProfileResponse.specializations === 'string') {
                  try {
                    specializations = JSON.parse(agentProfileResponse.specializations);
                  } catch (e) {
                    specializations = [];
                  }
                }
              }
              
              // Format registration start date for date input (YYYY-MM-DD)
              let registrationStartDate = '';
              if (agentProfileResponse.registration_start_date) {
                try {
                  const date = new Date(agentProfileResponse.registration_start_date);
                  if (!isNaN(date.getTime())) {
                    registrationStartDate = date.toISOString().split('T')[0];
                  }
                } catch (e) {
                  console.error('Error parsing registration_start_date:', e);
                }
              }
              
              setAgentFormData({
                ceaNumber: agentProfileResponse.cea_number || '',
                agentCompany: agentProfileResponse.company_name || '',
                companyPhoneNumber: agentProfileResponse.company_phone || '',
                companyEmail: agentProfileResponse.company_email || '',
                specializations: specializations,
                registrationStartDate: registrationStartDate
              });
              
              // Set license picture URL if it exists
              if (agentProfileResponse.license_picture_url) {
                setLicensePictureUrl(agentProfileResponse.license_picture_url);
              }
            }
          } catch (agentError) {
            console.log('Agent profile not found or error loading:', agentError);
            // Set default empty values for agent form
            setAgentFormData({
              ceaNumber: '',
              agentCompany: '',
              companyPhoneNumber: '',
              companyEmail: '',
              registrationStartDate: ''
            });
          }
        }
        
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
          isActive: profileResponse.is_active,
          userType: profileResponse.user_type
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

  // Check if subscription or checkout modal should be shown from navigation state
  useEffect(() => {
    console.log('🔍 Profile useEffect - location.state:', location.state);
    
    // Check sessionStorage first (backup for navigation state)
    const showCheckoutFromStorage = sessionStorage.getItem('showCheckoutModal');
    console.log('🔍 Profile useEffect - sessionStorage showCheckoutModal:', showCheckoutFromStorage);
    
    const shouldShowCheckout = location.state?.showCheckoutModal || showCheckoutFromStorage === 'true';
    const shouldShowSubscription = location.state?.showSubscriptionModal;
    
    if (shouldShowCheckout) {
      console.log('✅ Opening checkout modal from navigation state');
      setActiveTab('profile');
      setShowSubscriptionModal(false);
      // Use setTimeout to ensure state update happens
      setTimeout(() => {
        setShowCheckoutModal(true);
        console.log('✅ showCheckoutModal set to true');
      }, 0);
      // Default to monthly plan if not set
      setSelectedPlan('monthly');
      // Clear sessionStorage
      sessionStorage.removeItem('showCheckoutModal');
      
      // Clear the state after a delay to prevent showing modal on subsequent visits
      setTimeout(() => {
        window.history.replaceState({}, document.title);
      }, 500);
    } else if (shouldShowSubscription) {
      console.log('Opening subscription modal from navigation state');
      setActiveTab('profile');
      setShowSubscriptionModal(true);
      // Clear the state after a delay to prevent showing modal on subsequent visits
      setTimeout(() => {
        window.history.replaceState({}, document.title);
      }, 500);
    }
    
  }, [location.state, location.pathname]);

  // Debug: Log when showCheckoutModal changes
  useEffect(() => {
    console.log('🔵 showCheckoutModal state changed to:', showCheckoutModal);
  }, [showCheckoutModal]);

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
    if (passwordData.newPassword.length < 8) {
      setApiError('New password must be at least 8 characters long!');
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
      
      // Add agent information if user is an agent
      if (userProfile.userType === 'agent') {
        profileData.agent_info = {
          cea_number: agentFormData.ceaNumber,
          company_name: agentFormData.agentCompany,
          company_phone: agentFormData.companyPhoneNumber,
          company_email: agentFormData.companyEmail,
          specializations: agentFormData.specializations,
          registration_start_date: agentFormData.registrationStartDate
        };
      }
      
      // Call backend API
      const response = await authAPI.updateProfile(profileData);
      
      setSuccessMessage('Profile updated successfully! Your changes have been saved.');
      
      // Update local state with new data from database
      setFormData(prev => ({
        ...prev,
        fullName: response.user.full_name,
        phoneNumber: response.user.phone_number
      }));
      
      // Update agent form data if response includes agent info
      if (response.agent_profile) {
        // Handle specializations - ensure it's an array
        let specializations = [];
        if (response.agent_profile.specializations) {
          if (Array.isArray(response.agent_profile.specializations)) {
            specializations = response.agent_profile.specializations;
          } else if (typeof response.agent_profile.specializations === 'string') {
            try {
              specializations = JSON.parse(response.agent_profile.specializations);
            } catch (e) {
              specializations = [];
            }
          }
        }
        
        // Handle contact preferences - ensure it's an array
        let contactPreferences = [];
        if (response.agent_profile.contact_preferences) {
          if (Array.isArray(response.agent_profile.contact_preferences)) {
            contactPreferences = response.agent_profile.contact_preferences;
          } else if (typeof response.agent_profile.contact_preferences === 'string') {
            try {
              contactPreferences = JSON.parse(response.agent_profile.contact_preferences);
            } catch (e) {
              contactPreferences = [];
            }
          }
        }
        
        // Format registration start date for date input (YYYY-MM-DD)
        let registrationStartDate = '';
        if (response.agent_profile.registration_start_date) {
          try {
            const date = new Date(response.agent_profile.registration_start_date);
            if (!isNaN(date.getTime())) {
              registrationStartDate = date.toISOString().split('T')[0];
            }
          } catch (e) {
            console.error('Error parsing registration_start_date:', e);
          }
        }
        
        setAgentFormData({
          ceaNumber: response.agent_profile.cea_number || '',
          agentCompany: response.agent_profile.company_name || '',
          companyPhoneNumber: response.agent_profile.company_phone || '',
          companyEmail: response.agent_profile.company_email || '',
          specializations: specializations,
          registrationStartDate: registrationStartDate
        });
        
        // Update license picture URL if provided
        if (response.agent_profile.license_picture_url) {
          setLicensePictureUrl(response.agent_profile.license_picture_url);
        }
      }
      
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

  const handleLicensePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLicensePicture(file);
      // Create a preview URL for the selected file
      const previewUrl = URL.createObjectURL(file);
      setLicensePictureUrl(previewUrl);
    }
  };

  const handleUploadLicensePicture = async () => {
    if (!licensePicture) {
      alert('Please select a license picture first.');
      return;
    }

    try {
      setIsUploadingLicense(true);
      setApiError('');
      
      console.log('Starting license picture upload...');
      console.log('File:', licensePicture);
      console.log('File name:', licensePicture.name);
      console.log('File size:', licensePicture.size);
      console.log('File type:', licensePicture.type);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('license_picture', licensePicture);
      
      console.log('FormData created, calling API...');
      
      // Call backend API to upload license picture
      const response = await authAPI.uploadLicensePicture(formData);
      
      console.log('Upload response:', response);
      
      if (response.license_picture_url) {
        setLicensePictureUrl(response.license_picture_url);
        setSuccessMessage('License picture uploaded successfully!');
        setLicensePicture(null); // Clear the file input
        console.log('License picture URL set:', response.license_picture_url);
      }
      
    } catch (error) {
      console.error('Error uploading license picture:', error);
      setApiError(error.message || 'Failed to upload license picture');
    } finally {
      setIsUploadingLicense(false);
    }
  };

  const handleManageSubscription = () => {
    setShowSubscriptionModal(true);
  };

  const handleCloseSubscriptionModal = () => {
    setShowSubscriptionModal(false);
  };

  const handleUpgradePlan = async () => {
    // Validate plan selection
    if (!selectedPlan) {
      setApiError('Please select a plan (monthly or yearly)');
      return;
    }
    
    // Close the subscription modal and show checkout modal
    setShowSubscriptionModal(false);
    setShowCheckoutModal(true);
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validate based on field type and format input
    let validatedValue = value;
    
    if (name === 'cardNumber') {
      // Only allow numbers
      validatedValue = value.replace(/[^\d]/g, '');
      // Format as XXXX XXXX XXXX XXXX
      validatedValue = validatedValue.replace(/(.{4})/g, '$1 ').trim();
      // Limit to 16 digits
      if (validatedValue.replace(/\s/g, '').length > 16) {
        validatedValue = validatedValue.replace(/\s/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
      }
    } else if (name === 'expiry') {
      // Only allow numbers
      validatedValue = value.replace(/[^\d]/g, '');
      // Auto format MM/YY
      if (validatedValue.length >= 2 && !validatedValue.includes('/')) {
        validatedValue = validatedValue.slice(0, 4);
        validatedValue = validatedValue.slice(0, 2) + '/' + validatedValue.slice(2);
      }
      // Limit to 4 digits
      if (validatedValue.replace(/\//g, '').length > 4) {
        validatedValue = validatedValue.replace(/\//g, '').slice(0, 4);
        if (validatedValue.length >= 2) {
          validatedValue = validatedValue.slice(0, 2) + '/' + validatedValue.slice(2);
        }
      }
    } else if (name === 'cvv') {
      // Only allow numbers, max 3 digits
      validatedValue = value.replace(/[^\d]/g, '').slice(0, 3);
    } else if (name === 'cardName') {
      // Only allow letters, spaces, and hyphens
      validatedValue = value.replace(/[^a-zA-Z\s-]/g, '');
    }
    
    setPaymentData(prev => ({
      ...prev,
      [name]: validatedValue
    }));
    
    // Clear error for this field when user starts typing
    setPaymentErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };
  
  const handlePaymentBlur = (e) => {
    const { name, value } = e.target;
    let error = '';
    
    if (name === 'cardNumber') {
      const cardDigits = value.replace(/\s/g, '');
      if (!cardDigits || cardDigits.length < 13 || cardDigits.length > 16) {
        error = 'Card number must be 13-16 digits';
      }
    } else if (name === 'expiry') {
      if (!value || !/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(value)) {
        error = 'Please enter valid expiry (MM/YY)';
      }
    } else if (name === 'cvv') {
      if (!value || value.length !== 3) {
        error = 'CVV must be 3 digits';
      }
    } else if (name === 'cardName') {
      if (!value || value.length < 2) {
        error = 'Please enter cardholder name';
      }
    }
    
    if (error) {
      setPaymentErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleCompletePayment = async () => {
    try {
      setIsUpgrading(true);
      setApiError('');
      setSuccessMessage('');
      
      // Validate all payment fields
      const errors = {};
      let hasErrors = false;
      
      // Card number validation
      if (!paymentData.cardNumber || paymentData.cardNumber.replace(/\s/g, '').length < 13) {
        errors.cardNumber = 'Please enter a valid card number (13-16 digits)';
        hasErrors = true;
      }
      
      // Expiry validation
      if (!paymentData.expiry || !/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(paymentData.expiry)) {
        errors.expiry = 'Please enter a valid expiry date (MM/YY)';
        hasErrors = true;
      }
      
      // CVV validation
      if (!paymentData.cvv || paymentData.cvv.length !== 3) {
        errors.cvv = 'CVV must be 3 digits';
        hasErrors = true;
      }
      
      // Cardholder name validation
      if (!paymentData.cardName || paymentData.cardName.length < 2) {
        errors.cardName = 'Please enter cardholder name (letters only)';
        hasErrors = true;
      }
      
      if (hasErrors) {
        setPaymentErrors(errors);
        setApiError('Please correct the errors in the payment form');
        return;
      }
      
      // Check for existing field errors
      if (paymentErrors.cardNumber || paymentErrors.expiry || paymentErrors.cvv || paymentErrors.cardName) {
        setApiError('Please correct the errors in the payment form');
        return;
      }
      
      // Prepare upgrade data
      const upgradeData = {
        plan: selectedPlan
      };
      
      console.log('Upgrading with data:', upgradeData);
      
      // Call backend API to upgrade with plan
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
      setShowCheckoutModal(false);
      
      // Reset form
      setSelectedPlan('monthly');
      setPaymentData({
        cardNumber: '',
        expiry: '',
        cvv: '',
        cardName: ''
      });
      
      // Redirect to premium dashboard after a short delay to show success message
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

  const handleCloseCheckoutModal = () => {
    setShowCheckoutModal(false);
    // Reset payment data and errors when closing
    setPaymentData({
      cardNumber: '',
      expiry: '',
      cvv: '',
      cardName: ''
    });
    setPaymentErrors({
      cardNumber: '',
      expiry: '',
      cvv: '',
      cardName: ''
    });
  };

  const handleBackToSubscription = () => {
    setShowCheckoutModal(false);
    setShowSubscriptionModal(true);
    // Only show subscription modal if user came from subscription modal
    // If they came directly to checkout (from price prediction), go back to price prediction page
    if (location.state?.showCheckoutModal) {
      // User came directly to checkout from price prediction, navigate back
      navigate('/dashboard/priceprediction');
    } else {
    setShowSubscriptionModal(true);
    }
  };

  const getPlanPrice = () => {
    return selectedPlan === 'yearly' ? '199.99' : '29';
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
      '⚠️ WARNING: This action will deactivate your account. You will not be able to log in with this account.\n\nAre you sure you want to proceed?'
    );
    
    if (confirmed) {
      try {
      setIsLoading(true);
        setApiError('');
        
        // Call backend API to deactivate own account
        await authAPI.deactivateOwnAccount();
        
        // Show deactivation confirmation
        alert('Your account has been deactivated. You will be logged out.');
        
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

          {/* Agent Information (only for Agent users) */}
          {userProfile.userType === 'agent' && (
            <section className="profile-section">
              <h2 className="profile-subsection-title">Agent Information</h2>
              <div className="profile-form-group">
                <label htmlFor="ceaNumber">CEA License Number</label>
                <input
                  type="text"
                  id="ceaNumber"
                  name="ceaNumber"
                  value={agentFormData.ceaNumber}
                  onChange={(e) => setAgentFormData(prev => ({ ...prev, ceaNumber: e.target.value }))}
                  placeholder="Enter your CEA License Number"
                  disabled={isLoading}
                />
              </div>
              <div className="profile-form-group">
                <label htmlFor="agentCompany">Agent Company Name</label>
                <input
                  type="text"
                  id="agentCompany"
                  name="agentCompany"
                  value={agentFormData.agentCompany}
                  onChange={(e) => setAgentFormData(prev => ({ ...prev, agentCompany: e.target.value }))}
                  placeholder="Enter your agent company name"
                  disabled={isLoading}
                />
              </div>
              <div className="profile-form-group">
                <label htmlFor="companyPhoneNumber">Company Phone Number</label>
                <input
                  type="tel"
                  id="companyPhoneNumber"
                  name="companyPhoneNumber"
                  value={agentFormData.companyPhoneNumber}
                  onChange={(e) => setAgentFormData(prev => ({ ...prev, companyPhoneNumber: e.target.value }))}
                  placeholder="Enter your company phone number"
                  disabled={isLoading}
                />
              </div>
              <div className="profile-form-group">
                <label htmlFor="companyEmail">Company Email Address</label>
                <input
                  type="email"
                  id="companyEmail"
                  name="companyEmail"
                  value={agentFormData.companyEmail}
                  onChange={(e) => setAgentFormData(prev => ({ ...prev, companyEmail: e.target.value }))}
                  placeholder="Enter your company email address"
                  disabled={isLoading}
                />
              </div>

              <div className="profile-form-group">
                <label htmlFor="specializations">Specializations (Property Types)</label>
                <div className="profile-specializations-container">
                  {propertyTypes.map(propertyType => (
                    <label key={propertyType} className="profile-specialization-checkbox">
                      <input
                        type="checkbox"
                        checked={agentFormData.specializations.includes(propertyType)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAgentFormData(prev => ({
                              ...prev,
                              specializations: [...prev.specializations, propertyType]
                            }));
                          } else {
                            setAgentFormData(prev => ({
                              ...prev,
                              specializations: prev.specializations.filter(s => s !== propertyType)
                            }));
                          }
                        }}
                        disabled={isLoading}
                      />
                      <span>{propertyType}</span>
                    </label>
                  ))}
                </div>
                <small className="profile-form-help-text">
                  Select one or more property types you specialize in
                </small>
              </div>
              <div className="profile-form-group">
                <label htmlFor="registrationStartDate">Registration Start Date</label>
                <input
                  type="date"
                  id="registrationStartDate"
                  name="registrationStartDate"
                  value={agentFormData.registrationStartDate}
                  onChange={(e) => setAgentFormData(prev => ({ ...prev, registrationStartDate: e.target.value }))}
                  placeholder="Select registration start date"
                  disabled={isLoading}
                />
                <small className="profile-form-help-text">
                  The date when you started your agent registration
                </small>
              </div>
            </section>
          )}

          {/* CEA License (only for Agent users) */}
          {userProfile.userType === 'agent' && (
            <section className="profile-section">
              <h2 className="profile-subsection-title">CEA License</h2>
              <div className="profile-form-group">
                <label htmlFor="licensePicture">License Picture</label>
                <div className="profile-license-upload">
                  <input
                    type="file"
                    id="licensePicture"
                    name="licensePicture"
                    accept="image/*,.pdf"
                    disabled={isLoading}
                    className="profile-license-file-input"
                    onChange={handleLicensePictureChange}
                  />
                  <div className="profile-license-buttons">
                    <button 
                      type="button"
                      className="profile-license-select-btn"
                      onClick={() => document.getElementById('licensePicture').click()}
                      disabled={isLoading}
                    >
                      Select License Picture
                    </button>
                    <button 
                      type="button"
                      className="profile-license-upload-btn"
                      onClick={handleUploadLicensePicture}
                      disabled={isLoading || !licensePicture || isUploadingLicense}
                    >
                      {isUploadingLicense ? 'Uploading...' : 'Upload License Picture'}
                    </button>
                  </div>
                  <p className="profile-license-help-text">
                    Upload a clear image or PDF of your CEA license for verification. Supported formats: PNG, JPG, JPEG, GIF, PDF
                  </p>
                </div>
                {licensePictureUrl && (
                  <div className="profile-license-preview">
                    <h4>Current License Picture:</h4>
                    {licensePictureUrl.endsWith('.pdf') ? (
                      <div className="profile-license-pdf">
                        <p>📄 PDF Document: {licensePictureUrl.split('/').pop()}</p>
                        <a href={`${BACKEND_ORIGIN || ''}${licensePictureUrl}`} target="_blank" rel="noopener noreferrer" className="profile-license-view-btn">
                          View PDF
                        </a>
                      </div>
                    ) : (
                      <img src={`${BACKEND_ORIGIN || ''}${licensePictureUrl}`} alt="License Preview" />
                    )}
                    <div className="profile-license-actions">
                      <button 
                        type="button"
                        className="profile-license-remove-btn"
                        onClick={() => {
                          setLicensePictureUrl('');
                          setLicensePicture(null);
                        }}
                        disabled={isLoading}
                      >
                        Remove Picture
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

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
                      <label htmlFor="monthly">Monthly - $29/month</label>
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

      {/* Payment Checkout Modal */}
      {showCheckoutModal && (
<<<<<<< HEAD
        <div className="profile-modal-overlay checkout-modal-overlay">
=======
        <div className="profile-modal-overlay checkout-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowCheckoutModal(false);
          }
        }}>
>>>>>>> Mandy
          <div className="checkout-modal-container">
            {/* Left Panel - Payment Form */}
            <div className="checkout-form-panel">
              <div className="checkout-header">
                <button 
                  className="checkout-back-btn"
                  onClick={handleBackToSubscription}
                >
                  ← Back
                </button>
              </div>
              
              <div className="checkout-content">
                <h2 className="checkout-title">Payment</h2>
                <p className="checkout-subtitle">Enter your payment details to complete the upgrade</p>
                
                {/* Error and Success Messages */}
                {apiError && (
                  <div className="checkout-error-message">
                    {apiError}
                  </div>
                )}
                
                <div className="payment-form">
                  <div className="form-group">
                    <label htmlFor="cardNumber">Card Number</label>
                    <div className={`input-container ${paymentErrors.cardNumber ? 'input-error' : ''}`}>
                      <span className="input-icon">💳</span>
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        value={paymentData.cardNumber}
                        onChange={handlePaymentInputChange}
                        onBlur={handlePaymentBlur}
                        placeholder="1234 5678 9012 3456"
                        className="card-input"
                        maxLength={19}
                      />
                    </div>
                    {paymentErrors.cardNumber && (
                      <span className="field-error">{paymentErrors.cardNumber}</span>
                    )}
                  </div>

                  <div className="card-row">
                    <div className="form-group">
                      <label htmlFor="expiry">Expiry Date</label>
                      <div className={`input-container ${paymentErrors.expiry ? 'input-error' : ''}`}>
                        <span className="input-icon">📅</span>
                        <input
                          type="text"
                          id="expiry"
                          name="expiry"
                          value={paymentData.expiry}
                          onChange={handlePaymentInputChange}
                          onBlur={handlePaymentBlur}
                          placeholder="MM/YY"
                          className="card-input"
                          maxLength={5}
                        />
                      </div>
                      {paymentErrors.expiry && (
                        <span className="field-error">{paymentErrors.expiry}</span>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="cvv">CVV</label>
                      <div className={`input-container ${paymentErrors.cvv ? 'input-error' : ''}`}>
                        <span className="input-icon">🔒</span>
                        <input
                          type="text"
                          id="cvv"
                          name="cvv"
                          value={paymentData.cvv}
                          onChange={handlePaymentInputChange}
                          onBlur={handlePaymentBlur}
                          placeholder="123"
                          className="card-input"
                          maxLength={3}
                        />
                      </div>
                      {paymentErrors.cvv && (
                        <span className="field-error">{paymentErrors.cvv}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="cardName">Cardholder Name</label>
                    <div className={`input-container ${paymentErrors.cardName ? 'input-error' : ''}`}>
                      <span className="input-icon">👤</span>
                      <input
                        type="text"
                        id="cardName"
                        name="cardName"
                        value={paymentData.cardName}
                        onChange={handlePaymentInputChange}
                        onBlur={handlePaymentBlur}
                        placeholder="Enter cardholder name"
                        className="card-input"
                      />
                    </div>
                    {paymentErrors.cardName && (
                      <span className="field-error">{paymentErrors.cardName}</span>
                    )}
                  </div>
                </div>

                <div className="checkout-buttons">
                  <button 
                    className="checkout-back-button"
                    onClick={handleBackToSubscription}
                    disabled={isUpgrading}
                  >
                    Back
                  </button>
                  <button 
                    className="checkout-complete-btn"
                    onClick={handleCompletePayment}
                    disabled={isUpgrading}
                  >
                    {isUpgrading ? 'Processing...' : 'Complete Payment'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel - Summary Overlay */}
            <div className="checkout-visual-panel">
              <img
                src="https://www.traveltalktours.com/wp-content/uploads/2023/12/swapnil-bapat-sJ7pYyJFyuA-unsplash-1-scaled.jpg"
                alt="Singapore Cityscape"
                className="checkout-photo"
              />
              
              {/* Payment Summary Overlay */}
              <div className="payment-summary-overlay">
                <div className="summary-box">
                  <h3>Summary</h3>
                  <div className="summary-plan">
                    <span className="plan-price">
                      ${getPlanPrice()}{selectedPlan === 'yearly' ? '/year' : '/month'}
                    </span>
                    <span className="plan-name">
                      Premium Plan
                    </span>
                  </div>
                  <div className="summary-breakdown">
                    <div className="summary-item">
                      <span>Subtotal:</span>
                      <span>${getPlanPrice()}</span>
                    </div>
                    <div className="summary-item">
                      <span>Tax:</span>
                      <span>$0</span>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-total">
                      <span>Total:</span>
                      <span>${getPlanPrice()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Profile;
