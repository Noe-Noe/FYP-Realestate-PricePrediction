import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../context/ApiContext';
import { authAPI } from '../services/api';
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
    userType: 'free',
    termsAccepted: false,
    // Agent specific fields
    ceaNumber: '',
    company: '',
    workNumber: '',
    companyEmail: '',
    ceaLicense: null,
    yearlyBilling: false // Added for pricing toggle
  });
  const [errors, setErrors] = useState({});
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

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
        // Subscription selection step
        if (formData.userType === 'free') {
          // Free users: submit registration data first, then redirect
          console.log('Free user signup - submitting registration data');
          // Call handleSubmit to register the user
          handleSubmit(new Event('submit'));
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
        } else if (formData.userType === 'admin') {
          // Admin users: submit registration data first, then navigate to dashboard
          console.log('Admin user signup - submitting registration data');
          // Call handleSubmit to register the user
          handleSubmit(new Event('submit'));
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
        // Call handleSubmit to register the user
        handleSubmit(new Event('submit'));
        return;
      }
      
      // For agent users, after payment, submit registration data
      if (currentStep === 7 && formData.userType === 'agent') {
        console.log('Agent user signup - submitting registration data');
        // Call handleSubmit to register the user
        handleSubmit(new Event('submit'));
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
          
          // Now navigate based on user type
          if (formData.userType === 'agent') {
            console.log('Agent user registration complete, navigating to agent dashboard');
            navigate('/dashboard/agent');
          } else if (formData.userType === 'admin') {
            // Admin users: navigate to admin dashboard
            console.log('Admin user registration complete, navigating to admin dashboard');
            navigate('/dashboard/sysadmin');
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
          <p>By accepting these terms, you agree to our service conditions, privacy policy, and data handling practices. You acknowledge that you have read and understood all terms before proceeding.</p>
          
          <h3>Privacy Policy</h3>
          <p>We collect and process your personal information in accordance with our privacy policy. Your data is protected and will not be shared with third parties without your consent.</p>
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

  const renderStep5 = () => (
    <div className="step-content">
      <div className="subscription-header">
        <h2 className="main-heading">Choose Your Perfect Plan</h2>
        <p className="subtitle">Select the plan that best fits your property management needs</p>
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
          <span className="save-badge">Save 20%</span>
        </button>
      </div>

      <div className="subscription-plans">
        <div 
          className={`plan-card ${formData.userType === 'free' ? 'selected' : ''}`}
          onClick={() => setFormData(prev => ({ ...prev, userType: 'free' }))}
        >
          <div className="plan-badge">Most Popular</div>
          <div className="plan-header">
            <h3 className="plan-title">Free</h3>
            <p className="plan-subtitle">Perfect for getting started</p>
            <div className="plan-price">
              <span className="price-amount">$0</span>
              <span className="price-period">/month</span>
            </div>
          </div>
          
          <div className="plan-features">
            <div className="feature-item">
              <span className="checkmark">✓</span>
              <span>Basic property valuations</span>
            </div>
            <div className="feature-item">
              <span className="checkmark">✓</span>
              <span>Up to 5 properties</span>
            </div>
            <div className="feature-item">
              <span className="checkmark">✓</span>
              <span>Standard reports</span>
            </div>
            <div className="feature-item">
              <span className="checkmark">✓</span>
              <span>Email support</span>
            </div>
            <div className="feature-item">
              <span className="checkmark">✓</span>
              <span>Mobile app access</span>
            </div>
          </div>

          <button className="choose-plan-btn">Get Started Free</button>
        </div>

        <div 
          className={`plan-card ${formData.userType === 'premium' ? 'selected' : ''}`}
          onClick={() => setFormData(prev => ({ ...prev, userType: 'premium' }))}
        >
          <div className="plan-badge">Best Value</div>
          <div className="plan-header">
            <h3 className="plan-title">Premium</h3>
            <p className="plan-subtitle">For growing businesses</p>
            <div className="plan-price">
              <span className="price-amount">${formData.yearlyBilling ? '24' : '29'}</span>
              <span className="price-period">/month</span>
            </div>
            {formData.yearlyBilling && (
              <div className="yearly-savings">Save $60/year</div>
            )}
          </div>
          
          <div className="plan-features">
            <div className="feature-item">
              <span className="checkmark">✓</span>
              <span>Everything in Free</span>
            </div>
            <div className="feature-item">
              <span className="checkmark">✓</span>
              <span>Unlimited properties</span>
            </div>
            <div className="feature-item">
              <span className="checkmark">✓</span>
              <span>Advanced analytics</span>
            </div>
            <div className="feature-item">
              <span className="checkmark">✓</span>
              <span>Custom reports</span>
            </div>
            <div className="feature-item">
              <span className="checkmark">✓</span>
              <span>Priority support</span>
            </div>
            <div className="feature-item">
              <span className="checkmark">✓</span>
              <span>API access</span>
            </div>
            <div className="feature-item">
              <span className="checkmark">✓</span>
              <span>Team collaboration</span>
            </div>
          </div>

          <button className="choose-plan-btn">Choose Premium</button>
        </div>

        <div 
          className={`plan-card ${formData.userType === 'agent' ? 'selected' : ''}`}
          onClick={() => setFormData(prev => ({ ...prev, userType: 'agent' }))}
        >
          <div className="plan-badge">Professional</div>
          <div className="plan-header">
            <h3 className="plan-title">Agent</h3>
            <p className="plan-subtitle">For real estate professionals</p>
            <div className="plan-price">
              <span className="price-amount">${formData.yearlyBilling ? '79' : '99'}</span>
              <span className="price-period">/month</span>
            </div>
            {formData.yearlyBilling && (
              <div className="yearly-savings">Save $240/year</div>
            )}
          </div>
          
          <div className="plan-features">
            <div className="feature-item">
              <span className="checkmark">✓</span>
              <span>Everything in Premium</span>
            </div>
            <div className="feature-item">
              <span className="checkmark">✓</span>
              <span>Client management</span>
            </div>
            <div className="feature-item">
              <span className="checkmark">✓</span>
              <span>Lead generation tools</span>
            </div>
            <div className="feature-item">
              <span className="checkmark">✓</span>
              <span>Commission tracking</span>
            </div>
            <div className="feature-item">
              <span className="checkmark">✓</span>
              <span>Marketing automation</span>
            </div>
            <div className="feature-item">
              <span className="checkmark">✓</span>
              <span>Dedicated account manager</span>
            </div>
            <div className="feature-item">
              <span className="checkmark">✓</span>
              <span>White-label solutions</span>
            </div>
          </div>

          <button className="choose-plan-btn">Choose Agent</button>
        </div>

      </div>

              <div className="plan-comparison">
          <h4>All plans include:</h4>
          <div className="comparison-features">
            <span>✓ 30-day money-back guarantee</span>
            <span>✓ Cancel anytime</span>
            <span>✓ 99.9% uptime SLA</span>
            <span>✓ GDPR compliant</span>
          </div>
          <div className="admin-note">
            <small 
              className={`admin-link ${formData.userType === 'admin' ? 'selected' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, userType: 'admin' }))}
              style={{ cursor: 'pointer' }}
            >
              admin
            </small>
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

          <form className="signup-form" onSubmit={handleSubmit}>
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
            {renderCurrentStep()}
          </form>
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
            {currentStep === 7 && (
              <div className="payment-summary-overlay">
                <div className="summary-box">
                  <h3>Summary</h3>
                  <div className="summary-plan">
                    <span className="plan-price">
                      {formData.userType === 'premium' ? '$29' : 
                       formData.userType === 'admin' ? 'Contact Sales' : '$99'}/month
                    </span>
                    <span className="plan-name">
                      {formData.userType === 'premium' ? 'Premium' : 
                       formData.userType === 'admin' ? 'System Admin' : 'Agent'}
                    </span>
                  </div>
                  <div className="summary-breakdown">
                    <div className="summary-item">
                      <span>Subtotal:</span>
                      <span>
                        {formData.userType === 'premium' ? '$29' : 
                         formData.userType === 'admin' ? 'Contact Sales' : '$99'}
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
                        {formData.userType === 'premium' ? '$29' : 
                         formData.userType === 'admin' ? 'Contact Sales' : '$99'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
