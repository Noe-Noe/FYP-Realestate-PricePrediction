import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../context/ApiContext';
import { authAPI } from '../../services/api';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './TrialSystem.css';

const TrialSystem = () => {
  const [activeTab, setActiveTab] = useState('trial');
  const [trialStatus, setTrialStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  
  const { getUserName } = useApi();
  const navigate = useNavigate();

  // Check trial status on component mount
  useEffect(() => {
    const checkTrialStatus = async () => {
      try {
        setLoading(true);
        const response = await authAPI.getTrialStatus();
        setTrialStatus(response);
        
        // Calculate days left if trial is active
        if (response.trial_active && response.trial_end_date) {
          const endDate = new Date(response.trial_end_date);
          const now = new Date();
          const diffTime = endDate - now;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setTrialDaysLeft(Math.max(0, diffDays));
        }
        
        // Show trial modal if user hasn't used trial yet
        if (!response.trial_used && !response.trial_active) {
          setShowTrialModal(true);
        }
      } catch (err) {
        console.error('Error checking trial status:', err);
        setError('Failed to load trial information');
      } finally {
        setLoading(false);
      }
    };

    checkTrialStatus();
  }, []);

  const startTrial = async () => {
    try {
      const response = await authAPI.startTrial();
      setTrialStatus(response);
      setShowTrialModal(false);
      setTrialDaysLeft(7); // 7-day trial
      alert('Trial started successfully! You now have access to premium features for 7 days.');
    } catch (err) {
      console.error('Error starting trial:', err);
      alert('Failed to start trial. Please try again.');
    }
  };

  const upgradeToPremium = () => {
    navigate('/dashboard/subscription-plans');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="user-dashboard">
        <Header />
        <div className="user-dashboard-container">
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="user-main-content">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading trial information...</p>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          <div className="user-content-header">
            <h1 className="user-main-title">Trial & Subscription</h1>
            <p className="user-subtitle">Manage your trial and subscription status</p>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}

          {/* Trial Status Card */}
          <div className="trial-status-card">
            <div className="trial-header">
              <h2>Trial Status</h2>
              <div className={`trial-badge ${trialStatus?.trial_active ? 'active' : trialStatus?.trial_used ? 'used' : 'available'}`}>
                {trialStatus?.trial_active ? 'Active' : trialStatus?.trial_used ? 'Used' : 'Available'}
              </div>
            </div>

            {trialStatus?.trial_active ? (
              <div className="trial-active">
                <div className="trial-info">
                  <p className="trial-days-left">
                    <span className="days-number">{trialDaysLeft}</span>
                    <span className="days-text">days left in your trial</span>
                  </p>
                  <p className="trial-end-date">
                    Trial ends on: {formatDate(trialStatus.trial_end_date)}
                  </p>
                </div>
                <div className="trial-features">
                  <h3>Premium Features Available:</h3>
                  <ul>
                    <li>✅ Unlimited price predictions</li>
                    <li>✅ Property comparison tools</li>
                    <li>✅ Advanced search filters</li>
                    <li>✅ Priority customer support</li>
                    <li>✅ Detailed market analytics</li>
                  </ul>
                </div>
                <div className="trial-actions">
                  <button className="upgrade-btn" onClick={upgradeToPremium}>
                    Upgrade to Premium
                  </button>
                </div>
              </div>
            ) : trialStatus?.trial_used ? (
              <div className="trial-used">
                <p>You have already used your free trial.</p>
                <p>Upgrade to premium to continue enjoying all features.</p>
                <button className="upgrade-btn" onClick={upgradeToPremium}>
                  Upgrade to Premium
                </button>
              </div>
            ) : (
              <div className="trial-available">
                <p>You haven't started your free trial yet!</p>
                <p>Get 7 days of premium features completely free.</p>
                <button className="start-trial-btn" onClick={startTrial}>
                  Start Free Trial
                </button>
              </div>
            )}
          </div>

          {/* Subscription Plans Preview */}
          <div className="subscription-preview">
            <h2>Subscription Plans</h2>
            <div className="plans-grid">
              <div className="plan-card free">
                <h3>Free</h3>
                <div className="plan-price">$0<span>/month</span></div>
                <ul className="plan-features">
                  <li>3 price predictions per month</li>
                  <li>Basic property search</li>
                  <li>Standard support</li>
                </ul>
                <div className="plan-status current">Current Plan</div>
              </div>

              <div className="plan-card premium">
                <h3>Premium</h3>
                <div className="plan-price">$29<span>/month</span></div>
                <ul className="plan-features">
                  <li>Unlimited price predictions</li>
                  <li>Advanced search & filters</li>
                  <li>Property comparison tools</li>
                  <li>Market analytics</li>
                  <li>Priority support</li>
                </ul>
                <button className="plan-btn" onClick={upgradeToPremium}>
                  Upgrade Now
                </button>
              </div>

              <div className="plan-card agent">
                <h3>Agent</h3>
                <div className="plan-price">$99<span>/month</span></div>
                <ul className="plan-features">
                  <li>All Premium features</li>
                  <li>Property listing management</li>
                  <li>Client management tools</li>
                  <li>Lead generation</li>
                  <li>Dedicated support</li>
                </ul>
                <button className="plan-btn" onClick={upgradeToPremium}>
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Trial Modal */}
      {showTrialModal && (
        <div className="trial-modal-overlay">
          <div className="trial-modal">
            <div className="trial-modal-header">
              <h2>Start Your Free Trial</h2>
              <button 
                className="close-modal"
                onClick={() => setShowTrialModal(false)}
              >
                ×
              </button>
            </div>
            <div className="trial-modal-content">
              <div className="trial-offer">
                <h3>7 Days Free Trial</h3>
                <p>Get full access to all premium features for 7 days, completely free!</p>
              </div>
              <div className="trial-features-list">
                <h4>What you'll get:</h4>
                <ul>
                  <li>✅ Unlimited price predictions</li>
                  <li>✅ Advanced property search</li>
                  <li>✅ Property comparison tools</li>
                  <li>✅ Market analytics</li>
                  <li>✅ Priority support</li>
                </ul>
              </div>
              <div className="trial-modal-actions">
                <button className="start-trial-btn" onClick={startTrial}>
                  Start Free Trial
                </button>
                <button 
                  className="skip-trial-btn"
                  onClick={() => setShowTrialModal(false)}
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default TrialSystem;
