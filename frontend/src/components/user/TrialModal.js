import React, { useState, useEffect } from 'react';
import { trialAPI } from '../../services/api';
import './TrialModal.css';

const TrialModal = ({ isOpen, onClose, onTrialAccepted, onUpgrade }) => {
  const [trialStatus, setTrialStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      checkTrialStatus();
    }
  }, [isOpen]);

  const checkTrialStatus = async () => {
    try {
      setLoading(true);
      const response = await trialAPI.checkStatus();
      setTrialStatus(response);
    } catch (err) {
      console.error('Error checking trial status:', err);
      setError('Failed to check trial status');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    try {
      setLoading(true);
      await trialAPI.startTrial();
      onTrialAccepted();
      onClose();
    } catch (err) {
      console.error('Error starting trial:', err);
      setError('Failed to start trial. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    onUpgrade();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="trial-modal-overlay">
      <div className="trial-modal">
        <div className="trial-modal-header">
          <h2>🎯 Try Our Price Prediction</h2>
          <button className="trial-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="trial-modal-content">
          {loading ? (
            <div className="trial-loading">
              <div className="trial-spinner"></div>
              <p>Checking trial status...</p>
            </div>
          ) : error ? (
            <div className="trial-error">
              <p>❌ {error}</p>
              <button onClick={checkTrialStatus} className="trial-retry-btn">
                Try Again
              </button>
            </div>
          ) : trialStatus ? (
            <div className="trial-status">
              {trialStatus.trial_available ? (
                <div className="trial-available">
                  <div className="trial-icon">🎁</div>
                  <h3>Free Trial Available!</h3>
                  <p>Get <strong>1 free price prediction</strong> to see how accurate our AI-powered valuation is.</p>
                  
                  <div className="trial-features">
                    <div className="trial-feature">
                      <span className="trial-feature-icon">✅</span>
                      <span>AI-powered price prediction</span>
                    </div>
                    <div className="trial-feature">
                      <span className="trial-feature-icon">✅</span>
                      <span>Market trend analysis</span>
                    </div>
                    <div className="trial-feature">
                      <span className="trial-feature-icon">✅</span>
                      <span>Similar property comparisons</span>
                    </div>
                    <div className="trial-feature">
                      <span className="trial-feature-icon">✅</span>
                      <span>Detailed property report</span>
                    </div>
                  </div>
                  
                  <div className="trial-actions">
                    <button 
                      className="trial-start-btn"
                      onClick={handleStartTrial}
                      disabled={loading}
                    >
                      {loading ? 'Starting Trial...' : 'Start Free Trial'}
                    </button>
                    <button 
                      className="trial-upgrade-btn"
                      onClick={handleUpgrade}
                    >
                      Upgrade to Premium
                    </button>
                  </div>
                </div>
              ) : trialStatus.trial_used ? (
                <div className="trial-used">
                  <div className="trial-icon">🎯</div>
                  <h3>Trial Already Used</h3>
                  <p>You've already used your free trial prediction.</p>
                  
                  {trialStatus.trial_predictions_used > 0 && (
                    <div className="trial-stats">
                      <p>Predictions used: <strong>{trialStatus.trial_predictions_used}/{trialStatus.max_trial_predictions}</strong></p>
                    </div>
                  )}
                  
                  <div className="trial-actions">
                    <button 
                      className="trial-upgrade-btn primary"
                      onClick={handleUpgrade}
                    >
                      Upgrade to Premium
                    </button>
                    <button 
                      className="trial-cancel-btn"
                      onClick={onClose}
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              ) : (
                <div className="trial-error">
                  <div className="trial-icon">⚠️</div>
                  <h3>Unable to Check Trial Status</h3>
                  <p>Please try again or contact support if the issue persists.</p>
                  <button onClick={checkTrialStatus} className="trial-retry-btn">
                    Try Again
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TrialModal;
