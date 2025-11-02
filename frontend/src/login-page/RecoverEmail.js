import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './RecoverEmail.css';

const RecoverEmail = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    otp: ['', '', '', '', '', ''],
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: email, 2: OTP, 3: password

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    setApiError('');
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...formData.otp];
    newOtp[index] = value;
    setFormData(prev => ({ ...prev, otp: newOtp }));
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[name="otp-${index + 1}"]`);
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
    
    setApiError('');
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !formData.otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      const prevInput = document.querySelector(`input[name="otp-${index - 1}"]`);
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  const validateEmail = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    return true;
  };

  const validateOtp = () => {
    const otpString = formData.otp.join('');
    if (otpString.length !== 6) {
      setErrors({ otp: 'Please enter the 6-digit recovery code' });
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    return true;
  };

  const handleSendRecoveryCode = async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setIsLoading(true);
    setApiError('');

    try {
      await authAPI.forgotPassword(formData.email);
      setCurrentStep(2);
      setErrors({});
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!validateOtp()) return;

    setIsLoading(true);
    setApiError('');

    try {
      const otpString = formData.otp.join('');
      // Just verify the OTP is valid format, actual verification happens in reset password
      setCurrentStep(3);
      setErrors({});
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setIsLoading(true);
    setApiError('');

    try {
      const otpString = formData.otp.join('');
      await authAPI.resetPassword(formData.email, otpString, formData.newPassword);
      
      // Password reset successful
      alert('Password has been reset successfully! Please login with your new password.');
      navigate('/login');
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setApiError('');

    try {
      await authAPI.forgotPassword(formData.email);
      // Reset OTP input
      setFormData(prev => ({ ...prev, otp: ['', '', '', '', '', ''] }));
      alert('Recovery code resent successfully!');
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setCurrentStep(1);
    setFormData(prev => ({
      ...prev,
      otp: ['', '', '', '', '', ''],
      newPassword: '',
      confirmPassword: ''
    }));
    setErrors({});
    setApiError('');
  };

  const renderStep1 = () => (
    <form className="recover-form" onSubmit={handleSendRecoveryCode}>
      <div className="recover-input-container">
        <div className="recover-input-icon">📧</div>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={errors.email ? 'error' : ''}
          placeholder="Enter your registered email address"
          disabled={isLoading}
        />
      </div>
      {errors.email && <span className="error-message">{errors.email}</span>}
      {apiError && <span className="api-error-message">{apiError}</span>}

      <button type="submit" className="recover-btn" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send Recovery Code'}
      </button>
    </form>
  );

  const renderStep2 = () => (
    <form className="recover-form" onSubmit={handleVerifyOtp}>
      <div className="recover-email-display">
        <span className="recover-email-label">Email:</span>
        <span className="recover-email-value">{formData.email}</span>
        <button 
          type="button" 
          className="recover-change-email-btn"
          onClick={handleBackToEmail}
        >
          Change
        </button>
      </div>

      <div className="otp-container">
        <p className="otp-instruction">Enter the 6-digit recovery code sent to your email:</p>
        <div className="otp-inputs">
          {formData.otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              name={`otp-${index}`}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="otp-input"
              maxLength={1}
              disabled={isLoading}
            />
          ))}
        </div>
        {errors.otp && <span className="error-message">{errors.otp}</span>}
      </div>

      {apiError && <span className="api-error-message">{apiError}</span>}

      <button type="submit" className="recover-btn" disabled={isLoading}>
        {isLoading ? 'Verifying...' : 'Verify & Continue'}
      </button>

      <button 
        type="button" 
        className="resend-btn"
        onClick={handleResendCode}
        disabled={isLoading}
      >
        Resend Code
      </button>
    </form>
  );

  const renderStep3 = () => (
    <form className="recover-form" onSubmit={handleResetPassword}>
      <div className="recover-email-display">
        <span className="recover-email-label">Email:</span>
        <span className="recover-email-value">{formData.email}</span>
        <button 
          type="button" 
          className="recover-change-email-btn"
          onClick={handleBackToEmail}
        >
          Change
        </button>
      </div>

      <div className="recover-input-container">
        <div className="recover-input-icon">🔒</div>
        <input
          type="password"
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          className={errors.newPassword ? 'error' : ''}
          placeholder="Enter new password"
          disabled={isLoading}
        />
      </div>
      {errors.newPassword && <span className="error-message">{errors.newPassword}</span>}

      <div className="recover-input-container">
        <div className="recover-input-icon">🔒</div>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={errors.confirmPassword ? 'error' : ''}
          placeholder="Confirm new password"
          disabled={isLoading}
        />
      </div>
      {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}

      {apiError && <span className="api-error-message">{apiError}</span>}

      <button type="submit" className="recover-btn" disabled={isLoading}>
        {isLoading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Recover Account';
      case 2: return 'Enter Recovery Code';
      case 3: return 'Reset Password';
      default: return 'Recover Account';
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1: return 'Enter your registered email address to recover your account';
      case 2: return 'Enter the 6-digit recovery code sent to your email';
      case 3: return 'Create a new password for your account';
      default: return 'Enter your registered email address to recover your account';
    }
  };

  return (
    <div className="recover-page">
      <div className="recover-container">
        {/* Form Panel */}
        <div className="recover-form-panel">
          <div className="recover-page-title-section">
            <h1 className="recover-page-title">{getStepTitle()}</h1>
            <p className="recover-section-subtitle">{getStepSubtitle()}</p>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar">
            <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
            <div className={`progress-line ${currentStep >= 2 ? 'active' : ''}`}></div>
            <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
            <div className={`progress-line ${currentStep >= 3 ? 'active' : ''}`}></div>
            <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
          </div>

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          <div className="recover-footer">
            <p>
              Remember your password?{' '}
              <a href="/login" className="login-link">Sign in</a>
            </p>
          </div>

          <div className="back-to-home">
            <a href="/" className="back-link">
              ← Back to Home
            </a>
          </div>
        </div>

        {/* Visual Panel */}
        <div className="visual-panel">
          <div className="cityscape-photo"></div>
        </div>
      </div>
    </div>
  );
};

export default RecoverEmail;
