import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../context/ApiContext';
import { onboardingAPI } from '../services/api';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useApi();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    // Note: Minimum length validation removed from login - backend will handle authentication

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Clear any previous errors
      clearError();
      
      // Attempt real login
      const result = await login(formData);
      console.log('Login successful:', result);
      console.log('Full result object:', result);
      
      // Check if user is a first-time user and redirect accordingly
      console.log('Checking if user is first-time user...');
      console.log('User type:', result.user_type);
      
      try {
        let targetRoute = '/dashboard'; // Default route
        
        if (result.user_type === 'admin') {
          // Admin users go directly to admin dashboard - no onboarding needed
          targetRoute = '/dashboard/sysadmin';
          console.log('Admin user - redirecting to admin dashboard');
        } else if (result.user_type === 'agent') {
          // For agents, check agent-specific onboarding status
          const agentStatus = await onboardingAPI.checkAgentStatus();
          console.log('Agent onboarding status:', agentStatus);
          
          if (agentStatus.first_time_agent) {
            targetRoute = '/first-time-agent';
            console.log('First-time agent - redirecting to agent onboarding');
          } else {
            targetRoute = '/dashboard/agent';
            console.log('Returning agent - redirecting to agent dashboard');
          }
        } else {
          // For regular users (free/premium), check general user onboarding status
          const onboardingStatus = await onboardingAPI.checkUserStatus();
          console.log('User onboarding status:', onboardingStatus);
          
          if (onboardingStatus.first_time_user) {
            targetRoute = '/first-time';
            console.log('First-time user - redirecting to user onboarding');
          } else {
            // Returning user - redirect to appropriate dashboard
            if (result.user_type === 'premium') {
              targetRoute = '/dashboard';
              console.log('Target: Main dashboard (Premium user)');
            } else {
              targetRoute = '/dashboard';
              console.log('Target: Main dashboard (Free user)');
            }
          }
        }
        
        console.log('Navigating to:', targetRoute);
        
        // Wait a bit for localStorage to be properly set
        setTimeout(() => {
          console.log('Attempting navigation after delay...');
          // Try React Router navigation first
          navigate(targetRoute);
          
          // Force navigation if React Router fails
          setTimeout(() => {
            if (window.location.pathname !== targetRoute) {
              console.log('React Router failed, forcing navigation...');
              window.location.href = targetRoute;
            }
          }, 100);
        }, 300);
        
      } catch (onboardingError) {
        console.error('Error checking onboarding status:', onboardingError);
        // Fallback to original logic if onboarding check fails
        let targetRoute = '/dashboard';
        
        if (result.user_type === 'admin') {
          targetRoute = '/dashboard/sysadmin';
        } else if (result.user_type === 'agent') {
          targetRoute = '/dashboard/agent';
        }
        
        console.log('Fallback navigation to:', targetRoute);
        setTimeout(() => {
          navigate(targetRoute);
        }, 300);
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Error is already handled by the API context
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Form Panel */}
        <div className="login-form-panel">
          <div className="login-page-title-section">
            <h1 className="login-page-title">Welcome Back</h1>
            <p className="login-section-subtitle">Sign in to your account to continue your journey</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-input-container">
              <div className="login-input-icon">📧</div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                placeholder="Enter your email address"
              />
            </div>
            {errors.email && <span className="error-message">{errors.email}</span>}

            <div className="login-input-container">
              <div className="login-input-icon">🔒</div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
                placeholder="Enter your password"
              />
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}

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

            <div className="form-options">
              <label className="checkbox-container">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Remember me
              </label>
              <a href="/forgot-password" className="forgot-link">Forgot Password?</a>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account?{' '}
              <a href="/signup" className="signup-link">Sign up</a>
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

export default Login;
