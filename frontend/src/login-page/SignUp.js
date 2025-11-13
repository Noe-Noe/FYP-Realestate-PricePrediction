import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../context/ApiContext';
import { authAPI, subscriptionPlansAPI, importantFeaturesAPI, onboardingAPI, legalAPI } from '../services/api';
import './SignUp.css';

const SignUp = () => {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useApi();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: '', // Changed from 'free' to empty string - user must select a plan
    termsAccepted: false,
    // Agent specific fields
    ceaNumber: '',
    company: '',
    workNumber: '',
    companyEmail: '',
    ceaLicense: null,
    specializations: [], // Array of selected property type specializations
    registrationStartDate: '',
    yearlyBilling: false // Added for pricing toggle
  });
  const [errors, setErrors] = useState({});
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [importantFeatures, setImportantFeatures] = useState([]);
  const [legalTerms, setLegalTerms] = useState('');
  const [privacyPolicy, setPrivacyPolicy] = useState('');

  // Fetch subscription plans, important features, and legal content on component mount
  useEffect(() => {
    fetchSubscriptionPlans();
    fetchImportantFeatures();
    fetchLegalContent();
  }, []);

  // Update plan prices when yearly billing toggle changes
  useEffect(() => {
    if (subscriptionPlans.length > 0) {
      const updatedPlans = subscriptionPlans.map(plan => ({
        ...plan,
        currentPrice: formData.yearlyBilling ? plan.yearlyPrice : plan.monthlyPrice
      }));
      setSubscriptionPlans(updatedPlans);
    }
  }, [formData.yearlyBilling]);

  // Debug: Track step changes
  useEffect(() => {
    console.log('Step changed to:', currentStep, 'UserType:', formData.userType);
  }, [currentStep, formData.userType]);

  const fetchSubscriptionPlans = async () => {
    try {
      console.log('Fetching subscription plans from API...');
      const response = await subscriptionPlansAPI.getAll();
      console.log('Subscription plans API response:', response);
      
      if (response.success) {
        const plans = response.plans.map(plan => ({
          id: plan.id,
          name: plan.plan_name,
          type: plan.plan_type,
          monthlyPrice: parseFloat(plan.monthly_price),
          yearlyPrice: parseFloat(plan.yearly_price),
          currentPrice: parseFloat(plan.monthly_price), // Default to monthly
          features: plan.features || [],
          isPopular: plan.is_popular || false,
          isActive: plan.is_active || true
        }));
        console.log('Processed subscription plans:', plans);
        setSubscriptionPlans(plans);
      } else {
        console.error('Failed to load subscription plans');
        // Fallback to default plans
        setSubscriptionPlans(getDefaultPlans());
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      // Fallback to default plans
      setSubscriptionPlans(getDefaultPlans());
    }
  };

  const fetchImportantFeatures = async () => {
    try {
      console.log('Fetching important features from API...');
      const response = await importantFeaturesAPI.getAll();
      console.log('Important features API response:', response);
      
      if (response.success) {
        const features = response.features.map(feature => feature.feature_name);
        console.log('Important features:', features);
        setImportantFeatures(features);
      } else {
        console.error('Failed to load important features');
        // Fallback to default features
        setImportantFeatures([
          '30-day money-back guarantee',
          'Cancel anytime',
          '99.9% uptime SLA',
          'GDPR compliant'
        ]);
      }
    } catch (error) {
      console.error('Error fetching important features:', error);
      // Fallback to default features
      setImportantFeatures([
        '30-day money-back guarantee',
        'Cancel anytime',
        '99.9% uptime SLA',
        'GDPR compliant'
      ]);
    }
  };

  const fetchLegalContent = async () => {
    try {
      console.log('Fetching legal content from API...');
      
      // Fetch Terms of Use
      try {
        const termsResponse = await legalAPI.getContent('terms_of_use');
        console.log('Terms of Use API response:', termsResponse);
        
        if (termsResponse.success && termsResponse.data) {
          setLegalTerms(termsResponse.data.content || '');
        } else {
          console.log('No Terms of Use found, using default');
          setLegalTerms('By accessing and using this real estate price prediction platform, you agree to be bound by these Terms of Service. You acknowledge that the property price predictions provided are estimates based on historical data and market trends, and should not be considered as definitive valuations or guarantees of actual property values. You agree to use the platform solely for informational purposes and understand that we are not responsible for any decisions made based on the predictions provided. You will not attempt to manipulate or abuse the system, and you will comply with all applicable laws and regulations when using our services. We reserve the right to modify these terms at any time, and your continued use of the platform constitutes acceptance of any changes.');
        }
      } catch (error) {
        console.error('Error fetching Terms of Use:', error);
        setLegalTerms('By accessing and using this real estate price prediction platform, you agree to be bound by these Terms of Service. You acknowledge that the property price predictions provided are estimates based on historical data and market trends, and should not be considered as definitive valuations or guarantees of actual property values. You agree to use the platform solely for informational purposes and understand that we are not responsible for any decisions made based on the predictions provided. You will not attempt to manipulate or abuse the system, and you will comply with all applicable laws and regulations when using our services. We reserve the right to modify these terms at any time, and your continued use of the platform constitutes acceptance of any changes.');
      }
      
      // Fetch Privacy Policy
      try {
        const privacyResponse = await legalAPI.getContent('privacy_policy');
        console.log('Privacy Policy API response:', privacyResponse);
        
        if (privacyResponse.success && privacyResponse.data) {
          setPrivacyPolicy(privacyResponse.data.content || '');
        } else {
          console.log('No Privacy Policy found, using default');
          setPrivacyPolicy('We are committed to protecting your personal information and privacy. When you register for an account, we collect information including your name, email address, password, and optionally your phone number for account verification and communication purposes. For agent accounts, we also collect professional details such as your CEA license number, company information, and business contact details. We use this information to provide and improve our services, send important notifications about your account, and personalize your experience on our platform. We implement industry-standard security measures to protect your data from unauthorized access, alteration, or disclosure. We will never sell your personal information to third parties. However, we may share anonymized usage data for analytics purposes. You have the right to access, update, or delete your personal information at any time by contacting us or using your account settings. By using our platform, you consent to the collection and use of your information as described in this policy.');
        }
      } catch (error) {
        console.error('Error fetching Privacy Policy:', error);
        setPrivacyPolicy('We are committed to protecting your personal information and privacy. When you register for an account, we collect information including your name, email address, password, and optionally your phone number for account verification and communication purposes. For agent accounts, we also collect professional details such as your CEA license number, company information, and business contact details. We use this information to provide and improve our services, send important notifications about your account, and personalize your experience on our platform. We implement industry-standard security measures to protect your data from unauthorized access, alteration, or disclosure. We will never sell your personal information to third parties. However, we may share anonymized usage data for analytics purposes. You have the right to access, update, or delete your personal information at any time by contacting us or using your account settings. By using our platform, you consent to the collection and use of your information as described in this policy.');
      }
    } catch (error) {
      console.error('Error fetching legal content:', error);
    }
  };

  const getDefaultPlans = () => [
    {
      id: 1,
      name: 'Free',
      type: 'free',
      monthlyPrice: 0,
      yearlyPrice: 0,
      currentPrice: 0,
      features: ['Basic property valuations', 'Limited searches', 'Basic support'],
      isPopular: false,
      isActive: true
    },
    {
      id: 2,
      name: 'Premium',
      type: 'premium',
      monthlyPrice: 29,
      yearlyPrice: 24,
      currentPrice: 29,
      features: ['Everything in Free', 'Advanced analytics', 'Priority support', 'Export reports'],
      isPopular: true,
      isActive: true
    },
    {
      id: 3,
      name: 'Agent',
      type: 'agent',
      monthlyPrice: 99,
      yearlyPrice: 79,
      currentPrice: 99,
      features: ['Everything in Premium', 'Agent dashboard', 'Client management', 'Custom branding'],
      isPopular: false,
      isActive: true
    }
  ];

  // Helper function to get current selected plan
  const getCurrentPlan = () => {
    return subscriptionPlans.find(plan => plan.type === formData.userType) || 
           getDefaultPlans().find(plan => plan.type === formData.userType);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input (for 6 digits, index goes 0-5)
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) {
          nextInput.focus();
          nextInput.select(); // Select the text for easy replacement
        }
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current box is empty and backspace, go to previous box
        const prevInput = document.getElementById(`otp-${index - 1}`);
        if (prevInput) {
          prevInput.focus();
          prevInput.select(); // Select the text for easy replacement
        }
      } else if (otp[index]) {
        // If current box has value, clear it first
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        ceaLicense: file
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1: // Name and Email
        if (!formData.fullName) {
          newErrors.fullName = 'Full name is required';
        }
        if (!formData.email) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Email is invalid';
        }
        break;

      case 2: // Email Verification
        const otpString = otp.join('');
        if (otpString.length !== 6) {
          newErrors.otp = 'Please enter the complete 6-digit OTP';
        }
        break;

      case 3: // Password
        if (!formData.password) {
          newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        }
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;

      case 4: // Terms
        if (!formData.termsAccepted) {
          newErrors.terms = 'You must accept the terms and conditions';
        }
        break;

      case 5: // Subscription
        if (!formData.userType) {
          newErrors.userType = 'Please select a subscription type';
        }
        break;

      case 6: // Agent Details (only if agent selected)
        if (formData.userType === 'agent') {
          if (!formData.ceaNumber) {
            newErrors.ceaNumber = 'CEA number is required';
          }
          if (!formData.company) {
            newErrors.company = 'Company name is required';
          }
          if (!formData.workNumber) {
            newErrors.workNumber = 'Work number is required';
          }
          if (!formData.companyEmail) {
            newErrors.companyEmail = 'Company email is required';
          } else if (!/\S+@\S+\.\S+/.test(formData.companyEmail)) {
            newErrors.companyEmail = 'Company email is invalid';
          }
          if (!formData.ceaLicense) {
            newErrors.ceaLicense = 'CEA license upload is required';
          }
          if (!formData.specializations || formData.specializations.length === 0) {
            newErrors.specializations = 'Please select at least one specialization';
          }
        }
        break;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2) {
        // OTP verification completed, move to password step
        setIsEmailVerified(true);
      }
      
      // Handle different subscription flows
      if (currentStep === 5) {
        // Subscription selection step - ensure a plan is actually selected
        if (!formData.userType) {
          console.log('No subscription plan selected');
          return; // Don't proceed if no plan is selected
        }
        
        console.log('Selected subscription plan:', formData.userType);
        
        if (formData.userType === 'free') {
          // Free users: submit registration data first, then redirect
          console.log('Free user signup - submitting registration data');
          // Call handleRegistration to register the user
          handleRegistration();
          return;
        } else if (formData.userType === 'premium') {
          // Premium users: go to payment step
          setCurrentStep(7);
          setErrors({});
          return;
        } else if (formData.userType === 'agent') {
          // Agent users: go to agent details step
          setCurrentStep(6);
          setErrors({});
          return;
        }
      }
      
      // For agent users, after agent details, go to payment
      if (currentStep === 6 && formData.userType === 'agent') {
        setCurrentStep(7);
        setErrors({});
        return;
      }
      

      
      // For premium users, after payment, submit registration data
      if (currentStep === 7 && formData.userType === 'premium') {
        console.log('Premium user signup - submitting registration data');
        // Call handleRegistration to register the user
        handleRegistration();
        return;
      }
      
      // For agent users, after payment, submit registration data
      if (currentStep === 7 && formData.userType === 'agent') {
        console.log('Agent user signup - submitting registration data');
        // Call handleRegistration to register the user
        handleRegistration();
        return;
      }
      

      
      // Default: move to next step
      setCurrentStep(prev => prev + 1);
      setErrors({});
    }
  };

  const prevStep = () => {
    // Handle special cases for different user types
    if (currentStep === 7 && formData.userType === 'premium') {
      // Premium users: go from payment back to subscription selection
      setCurrentStep(5);
    } else if (currentStep === 7 && formData.userType === 'agent') {
      // Agent users: go from payment back to agent details
      setCurrentStep(6);
    } else if (currentStep === 6 && formData.userType === 'agent') {
      // Agent users: go from agent details back to subscription selection
      setCurrentStep(5);
    } else {
      // Default: go back one step
      setCurrentStep(prev => prev - 1);
    }
    setErrors({});
  };

  const handleSendOTP = async () => {
    try {
      await authAPI.sendOTP(formData.email);
      // OTP sent successfully, move to OTP verification step
      setCurrentStep(2);
      setErrors({});
    } catch (error) {
      setErrors({ email: error.message });
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setErrors({ otp: 'Please enter the complete 6-digit code' });
      return;
    }

    try {
      await authAPI.verifyOTP(formData.email, otpString);
      // OTP verified successfully
      setIsEmailVerified(true);
      setCurrentStep(3); // Move to password creation step
      setErrors({});
    } catch (error) {
      setErrors({ otp: error.message });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted, current step:', currentStep);
    console.log('Form data:', formData);
    
    if (validateStep(currentStep)) {
      try {
        // Clear any previous errors
        clearError();
        
        // Prepare user data for registration
        const userData = {
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          user_type: formData.userType,
          phone_number: formData.workNumber || null
        };
        
        console.log('Sending registration data:', userData);
        
        // Attempt real registration
        const result = await register(userData);
        console.log('Registration successful:', result);
        
        // After successful registration, automatically log in the user
        try {
          console.log('Attempting auto-login for user type:', formData.userType);
          const loginResult = await authAPI.login({
            email: formData.email,
            password: formData.password
          });
          console.log('Auto-login successful:', loginResult);
          console.log('User type from login result:', loginResult.user?.user_type);
          console.log('User type from form:', formData.userType);
          
          // Set token and userType in localStorage (same as context login function)
          if (loginResult.access_token) {
            localStorage.setItem('accessToken', loginResult.access_token);
          }
          if (loginResult.user?.user_type) {
            localStorage.setItem('userType', loginResult.user.user_type);
            console.log('✅ Set userType in localStorage:', loginResult.user.user_type);
          } else if (formData.userType) {
            // Fallback to formData if login response doesn't have it
            localStorage.setItem('userType', formData.userType);
            console.log('✅ Set userType from formData in localStorage:', formData.userType);
          }
          
          // Now navigate based on user type
          if (formData.userType === 'agent') {
            console.log('Agent user registration complete, navigating to agent dashboard');
            
            // Update agent profile with signup details
            try {
              // Upload license if provided
              if (formData.ceaLicense) {
                const licenseFormData = new FormData();
                licenseFormData.append('license_picture', formData.ceaLicense);
                await authAPI.uploadLicensePicture(licenseFormData);
              }
              
              // Update agent profile with other details
              const profileData = {
                agent_info: {
                  cea_number: formData.ceaNumber,
                  company_name: formData.company,
                  company_phone: formData.workNumber,
                  company_email: formData.companyEmail,
                  specializations: formData.specializations,
                  registration_start_date: formData.registrationStartDate
                }
              };
              await authAPI.updateProfile(profileData);
              console.log('Agent profile updated with signup details');
            } catch (error) {
              console.error('Error updating agent profile:', error);
              // Don't block navigation if profile update fails
            }
            
            navigate('/dashboard/agent');
          } else if (formData.userType === 'premium') {
            navigate('/dashboard');
          } else {
            // Free users: navigate to free dashboard
            console.log('Free user registration complete, navigating to free dashboard');
            navigate('/dashboard');
          }
        } catch (loginError) {
          console.error('Auto-login failed:', loginError);
          console.error('Login error details:', loginError.message);
          // If auto-login fails, redirect to login page
          navigate('/login');
        }
      } catch (error) {
        console.error('Registration failed:', error);
        // Error is already handled by the API context
      }
    } else {
      console.log('Form validation failed');
    }
  };

  const handleRegistration = async () => {
    console.log('Handling registration for user type:', formData.userType);
    console.log('Form data:', formData);
    
    if (validateStep(currentStep)) {
      try {
        // Clear any previous errors
        clearError();
        
        // Prepare user data for registration
        const userData = {
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          user_type: formData.userType,
          phone_number: formData.workNumber || null
        };
        
        console.log('Sending registration data:', userData);
        
        // Attempt real registration
        const result = await register(userData);
        console.log('Registration successful:', result);
        
        // After successful registration, automatically log in the user
        try {
          console.log('Attempting auto-login for user type:', formData.userType);
          const loginResult = await authAPI.login({
            email: formData.email,
            password: formData.password
          });
          console.log('Auto-login successful:', loginResult);
          console.log('User type from login result:', loginResult.user?.user_type);
          console.log('User type from form:', formData.userType);
          
          // Set token and userType in localStorage (same as context login function)
          if (loginResult.access_token) {
            localStorage.setItem('accessToken', loginResult.access_token);
          }
          if (loginResult.user?.user_type) {
            localStorage.setItem('userType', loginResult.user.user_type);
            console.log('✅ Set userType in localStorage:', loginResult.user.user_type);
          } else if (formData.userType) {
            // Fallback to formData if login response doesn't have it
            localStorage.setItem('userType', formData.userType);
            console.log('✅ Set userType from formData in localStorage:', formData.userType);
          }
          
          // Now navigate based on user type
          if (formData.userType === 'agent') {
            console.log('Agent user registration complete, navigating to agent dashboard');
            
            // Update agent profile with signup details
            try {
              // Upload license if provided
              if (formData.ceaLicense) {
                const licenseFormData = new FormData();
                licenseFormData.append('license_picture', formData.ceaLicense);
                await authAPI.uploadLicensePicture(licenseFormData);
              }
              
              // Update agent profile with other details
              const profileData = {
                agent_info: {
                  cea_number: formData.ceaNumber,
                  company_name: formData.company,
                  company_phone: formData.workNumber,
                  company_email: formData.companyEmail,
                  specializations: formData.specializations,
                  registration_start_date: formData.registrationStartDate
                }
              };
              await authAPI.updateProfile(profileData);
              console.log('Agent profile updated with signup details');
            } catch (error) {
              console.error('Error updating agent profile:', error);
              // Don't block navigation if profile update fails
            }
            
            navigate('/dashboard/agent');
          } else if (formData.userType === 'premium') {
            navigate('/dashboard');
          } else {
            // Free users: navigate to free dashboard
            console.log('Free user registration complete, navigating to free dashboard');
            navigate('/dashboard');
          }
        } catch (loginError) {
          console.error('Auto-login failed:', loginError);
          console.error('Login error details:', loginError.message);
          // If auto-login fails, redirect to login page
          navigate('/login');
        }
      } catch (error) {
        console.error('Registration failed:', error);
        // Error is already handled by the API context
      }
    } else {
      console.log('Form validation failed');
    }
  };

  const renderStep1 = () => (
    <div className="step-content">
      <div className="step-1-form">
        <div className="form-group">
          <label htmlFor="fullName">Full Name</label>
          <div className="input-container">
            <span className="input-icon">👤</span>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={errors.fullName ? 'error' : ''}
              placeholder="Enter full name"
            />
          </div>
          {errors.fullName && <span className="error-message">{errors.fullName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <div className="input-container">
            <span className="input-icon">✉️</span>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="Enter email address"
            />
          </div>
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <button type="button" className="next-btn" onClick={handleSendOTP}>
          Send Verification Code
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <div className="otp-container">
        {otp.map((digit, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="text"
            maxLength="1"
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="otp-input"
            placeholder="•"
          />
        ))}
      </div>
      
      {errors.otp && <span className="error-message">{errors.otp}</span>}

      <div className="otp-instructions">
        <span className="instruction-text">Enter code sent to your email</span>
        <button type="button" className="resend-link" onClick={handleSendOTP}>Resend code</button>
      </div>

      <div className="step-buttons">
        <button type="button" className="btn-secondary" onClick={prevStep}>
          Back
        </button>
        <button type="button" className="next-btn" onClick={handleVerifyOTP}>
          Verify & Continue
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <div className="step-3-form">
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="input-container">
            <span className="input-icon">🔒</span>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              placeholder="Create a password (min 8 characters)"
            />
          </div>
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className="input-container">
            <span className="input-icon">🔒</span>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'error' : ''}
              placeholder="Confirm your password"
            />
          </div>
          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
        </div>

        <div className="step-buttons">
          <button type="button" className="btn-secondary" onClick={prevStep}>
            Back
          </button>
          <button type="button" className="next-btn" onClick={nextStep}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="step-content">
      <div className="terms-content">
        <div className="terms-text">
          <h3>Terms of Service</h3>
          <div className="terms-content-text">
            {(legalTerms || 'Loading terms of service...').split('\n').map((line, index) => {
              if (line.trim().startsWith('•')) {
                return (
                  <ul key={index} className="terms-list">
                    <li>{line.trim().substring(1).trim()}</li>
                  </ul>
                );
              } else if (line.trim()) {
                return <p key={index} className="terms-paragraph">{line}</p>;
              }
              return null;
            })}
          </div>
          
          <h3 className="terms-subheading">Privacy Policy</h3>
          <div className="terms-content-text">
            {(privacyPolicy || 'Loading privacy policy...').split('\n').map((line, index) => {
              if (line.trim().startsWith('•')) {
                return (
                  <ul key={index} className="terms-list">
                    <li>{line.trim().substring(1).trim()}</li>
                  </ul>
                );
              } else if (line.trim()) {
                return <p key={index} className="terms-paragraph">{line}</p>;
              }
              return null;
            })}
          </div>
        </div>
      </div>

      <div className="form-group checkbox-group">
        <label className="checkbox-container">
          <input
            type="checkbox"
            name="termsAccepted"
            checked={formData.termsAccepted}
            onChange={handleChange}
          />
          <span className="checkmark"></span>
          <span className="checkbox-text">I have read and agree to the Terms of Service and Privacy Policy</span>
        </label>
        {errors.terms && <span className="error-message">{errors.terms}</span>}
      </div>

      <div className="step-buttons">
        <button type="button" className="btn-secondary" onClick={prevStep}>
          Back
        </button>
        <button type="button" className="next-btn" onClick={nextStep}>
          Accept & Continue
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => {
    // Helper function to get plan badge text
    const getPlanBadge = (plan) => {
      if (plan.isPopular) return 'Most Popular';
      if (plan.type === 'premium') return 'Best Value';
      if (plan.type === 'agent') return 'Professional';
      return '';
    };

    // Helper function to get plan button text
    const getPlanButtonText = (plan) => {
      if (plan.type === 'free') return 'Get Started Free';
      if (plan.type === 'premium') return 'Choose Premium';
      if (plan.type === 'agent') return 'Choose Agent';
      return 'Choose Plan';
    };


    return (
      <div className="step-content">
        <div className="subscription-header">
          <h2 className="main-heading">Choose Your Perfect Plan</h2>
          <p className="subtitle">Select the plan that best fits your needs</p>
        </div>

        <div className="pricing-toggle">
          <button 
            className={`toggle-btn ${!formData.yearlyBilling ? 'active' : ''}`}
            onClick={() => setFormData(prev => ({ ...prev, yearlyBilling: false }))}
          >
            Monthly
          </button>
          <button 
            className={`toggle-btn ${formData.yearlyBilling ? 'active' : ''}`}
            onClick={() => setFormData(prev => ({ ...prev, yearlyBilling: true }))}
          >
            Yearly
          </button>
        </div>

        {!formData.userType && (
          <div className="plan-selection-notice">
            <p>👆 Please select a subscription plan to continue</p>
          </div>
        )}

        <div className="subscription-plans">
          {subscriptionPlans.map((plan) => (
            <div 
              key={plan.id}
              className={`plan-card ${formData.userType === plan.type ? 'selected' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.stopImmediatePropagation) {
                  e.stopImmediatePropagation();
                }
                console.log('Plan card clicked:', plan.type, 'Current step:', currentStep);
                setFormData(prev => ({ ...prev, userType: plan.type }));
                console.log('Plan selection completed, userType set to:', plan.type);
                return false;
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.stopImmediatePropagation) {
                  e.stopImmediatePropagation();
                }
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.stopImmediatePropagation) {
                  e.stopImmediatePropagation();
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              {plan.isPopular && <div className="plan-badge">{getPlanBadge(plan)}</div>}
              <div className="plan-header">
                <h3 className="plan-title">{plan.name}</h3>
                <p className="plan-subtitle">
                  {plan.type === 'free' ? 'Perfect for getting started' :
                   plan.type === 'premium' ? 'For growing businesses' :
                   'For real estate professionals'}
                </p>
                <div className="plan-price">
                  <span className="price-amount">${plan.currentPrice}</span>
                  <span className="price-period">{formData.yearlyBilling ? '/year' : '/month'}</span>
                </div>
              </div>
              
              <div className="plan-features">
                {plan.features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <span className="checkmark">✓</span>
                    <span>{feature.feature_name || feature}</span>
                  </div>
                ))}
              </div>

              <div className="choose-plan-btn">
                {getPlanButtonText(plan)}
              </div>
            </div>
          ))}
        </div>

        <div className="plan-comparison">
          <h4>All plans include:</h4>
          <div className="comparison-features">
            {importantFeatures.map((feature, index) => (
              <span key={index}>✓ {feature}</span>
            ))}
          </div>
        </div>

        {errors.userType && <span className="error-message">{errors.userType}</span>}

        <div className="step-buttons">
          <button type="button" className="btn-secondary" onClick={prevStep}>
            Back
          </button>
          <button type="button" className="next-btn" onClick={nextStep}>
            Continue
          </button>
        </div>
      </div>
    );
  };

  const renderStep6 = () => (
    <div className="step-content">
      <div className="form-group">
        <label htmlFor="ceaNumber">CEA Number *</label>
        <div className="input-container">
          <span className="input-icon">🆔</span>
          <input
            type="text"
            id="ceaNumber"
            name="ceaNumber"
            value={formData.ceaNumber}
            onChange={handleChange}
            className={errors.ceaNumber ? 'error' : ''}
            placeholder="Enter your CEA license number"
          />
        </div>
        {errors.ceaNumber && <span className="error-message">{errors.ceaNumber}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="company">Company Name *</label>
        <div className="input-container">
          <span className="input-icon">🏢</span>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className={errors.company ? 'error' : ''}
            placeholder="Enter your company name"
          />
        </div>
        {errors.company && <span className="error-message">{errors.company}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="workNumber">Work Phone Number *</label>
        <div className="input-container">
          <span className="input-icon">📞</span>
          <input
            type="tel"
            id="workNumber"
            name="workNumber"
            value={formData.workNumber}
            onChange={handleChange}
            className={errors.workNumber ? 'error' : ''}
            placeholder="Enter your work phone number"
          />
        </div>
        {errors.workNumber && <span className="error-message">{errors.workNumber}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="companyEmail">Company Email *</label>
        <div className="input-container">
          <span className="input-icon">✉️</span>
          <input
            type="email"
            id="companyEmail"
            name="companyEmail"
            value={formData.companyEmail}
            onChange={handleChange}
            className={errors.companyEmail ? 'error' : ''}
            placeholder="Enter your company email"
          />
        </div>
        {errors.companyEmail && <span className="error-message">{errors.companyEmail}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="ceaLicense">CEA License Upload *</label>
        <div className="input-container">
          <span className="input-icon">📄</span>
          <input
            type="file"
            id="ceaLicense"
            name="ceaLicense"
            onChange={handleFileUpload}
            className={errors.ceaLicense ? 'error' : ''}
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </div>
        {errors.ceaLicense && <span className="error-message">{errors.ceaLicense}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="specializations">Specializations (Property Types) *</label>
        <div className="signup-specializations-container">
          {[
            'Office',
            'Retail',
            'Shop House',
            'Single-user Factory',
            'Multiple-user Factory',
            'Warehouse',
            'Business Parks'
          ].map(propertyType => (
            <label key={propertyType} className="signup-specialization-checkbox">
              <input
                type="checkbox"
                checked={formData.specializations.includes(propertyType)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData(prev => ({
                      ...prev,
                      specializations: [...prev.specializations, propertyType]
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      specializations: prev.specializations.filter(s => s !== propertyType)
                    }));
                  }
                }}
              />
              <span>{propertyType}</span>
            </label>
          ))}
        </div>
        {errors.specializations && <span className="error-message">{errors.specializations}</span>}
        <small className="signup-form-help-text">
          Select one or more property types you specialize in
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="registrationStartDate">Registration Start Date</label>
        <input
          type="date"
          id="registrationStartDate"
          name="registrationStartDate"
          value={formData.registrationStartDate}
          onChange={(e) => setFormData(prev => ({ ...prev, registrationStartDate: e.target.value }))}
          className={errors.registrationStartDate ? 'error' : ''}
        />
        {errors.registrationStartDate && <span className="error-message">{errors.registrationStartDate}</span>}
        <small className="signup-form-help-text">
          The date when you started your agent registration
        </small>
      </div>

      <div className="step-buttons">
        <button type="button" className="btn-secondary" onClick={prevStep}>
          Back
        </button>
        <button type="button" className="next-btn" onClick={nextStep}>
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="step-content">
      <div className="payment-form">
        <div className="form-group">
          <label htmlFor="cardNumber">Card Number</label>
          <div className="input-container">
            <span className="input-icon">💳</span>
            <input
              type="text"
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              className="card-input"
            />
          </div>
        </div>

        <div className="card-row">
          <div className="form-group">
            <label htmlFor="expiry">Expiry Date</label>
            <div className="input-container">
              <span className="input-icon">📅</span>
              <input
                type="text"
                id="expiry"
                placeholder="MM/YY"
                className="card-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="cvv">CVV</label>
            <div className="input-container">
              <span className="input-icon">🔒</span>
              <input
                type="text"
                id="cvv"
                placeholder="123"
                className="card-input"
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="cardName">Cardholder Name</label>
          <div className="input-container">
            <span className="input-icon">👤</span>
            <input
              type="text"
              id="cardName"
              placeholder="Enter cardholder name"
              className="card-input"
            />
          </div>
        </div>
      </div>

      <div className="step-buttons">
        <button type="button" className="btn-secondary" onClick={prevStep}>
          Back
        </button>
        <button type="submit" className="next-btn">
          Complete Payment
        </button>
      </div>
    </div>
  );



  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      default: return renderStep1();
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Sign up';
      case 2: return 'Email Verification';
      case 3: return 'Create Password';
      case 4: return 'Terms & Conditions';
      case 5: return 'Choose Plan';
      case 6: return 'Agent Details';
      case 7: return 'Payment';
      default: return 'Sign up';
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1: return 'Get started with your account';
      case 2: return 'Enter OTP sent to your email';
      case 3: return 'Secure your account with a strong password';
      case 4: return 'Please review and accept our terms';
      case 5: return ''; // No subtitle for subscription step as it has its own header
      case 6: return 'Please provide your professional information';
      case 7: return ''; // No subtitle for payment step as it has its own subtitle
      default: return 'Get started with your account';
    }
  };

  const shouldShowPaymentStep = () => {
    return (formData.userType === 'agent' || formData.userType === 'premium') && currentStep === 7;
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        {/* Left Panel - Form */}
        <div className="signup-form-panel">
          <div className="signup-form-header">
            <div className="login-link-top">
              Already have an account? <a href="/login">Log in</a>
            </div>
          </div>

          {/* Progress Bar - Hide on payment step */}
          {currentStep !== 7 && (
            <div className="progress-bar">
              <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
              <div className={`progress-line ${currentStep >= 2 ? 'active' : ''}`}></div>
              <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
              <div className={`progress-line ${currentStep >= 3 ? 'active' : ''}`}></div>
              <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
              <div className={`progress-line ${currentStep >= 4 ? 'active' : ''}`}></div>
              <div className={`progress-step ${currentStep >= 4 ? 'active' : ''}`}>4</div>
              <div className={`progress-line ${currentStep >= 5 ? 'active' : ''}`}></div>
              <div className={`progress-step ${currentStep >= 5 ? 'active' : ''}`}>5</div>
            </div>
          )}

          {/* Page Title - Show underneath progress bar, hide for subscription step */}
          {currentStep !== 5 && (
            <div className="signup-page-title-section">
              <h1 className="signup-page-title">{getStepTitle()}</h1>
              <p className="section-subtitle">{getStepSubtitle()}</p>
            </div>
          )}

          {/* API Error Display */}
          {error && (
            <div className="api-error-message">
              {error}
              <button 
                type="button" 
                onClick={clearError}
                className="clear-error-btn"
              >
                ✕
              </button>
            </div>
          )}
          
          {/* Form for non-subscription steps */}
          {currentStep !== 5 && (
            <form className="signup-form" onSubmit={handleSubmit}>
              {renderCurrentStep()}
            </form>
          )}
          
          {/* Subscription plan selection - outside of form */}
          {currentStep === 5 && renderCurrentStep()}
        </div>

        {/* Right Panel - Cityscape Image */}
        <div className="visual-panel">
          <div className="cityscape-image">
            <img 
              src="https://www.traveltalktours.com/wp-content/uploads/2023/12/swapnil-bapat-sJ7pYyJFyuA-unsplash-1-scaled.jpg"
              alt="Singapore Cityscape"
              className="cityscape-photo"
            />
            
            {/* Payment Summary Overlay - Only show on payment step */}
            {currentStep === 7 && (() => {
              const currentPlan = getCurrentPlan();
              const price = currentPlan ? currentPlan.currentPrice : 0;
              const planName = currentPlan ? currentPlan.name : 'Unknown';
              
              return (
                <div className="payment-summary-overlay">
                  <div className="summary-box">
                    <h3>Summary</h3>
                    <div className="summary-plan">
                      <span className="plan-price">
                        ${price}{formData.yearlyBilling ? '/year' : '/month'}
                      </span>
                      <span className="plan-name">
                        {planName}
                      </span>
                    </div>
                    <div className="summary-breakdown">
                      <div className="summary-item">
                        <span>Subtotal:</span>
                        <span>
                          ${price}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span>Tax:</span>
                        <span>$0</span>
                      </div>
                      <div className="summary-divider"></div>
                      <div className="summary-total">
                        <span>Total:</span>
                        <span>
                          ${price}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
