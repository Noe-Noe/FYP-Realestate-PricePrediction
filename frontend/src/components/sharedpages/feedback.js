import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import Header from './header';
import Navbar from './navbar';
import Footer from './footer';
import './feedback.css';

const Feedback = () => {
  const [activeTab, setActiveTab] = useState('feedback');
  const [feedbackType, setFeedbackType] = useState('general');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [userFeedbacks, setUserFeedbacks] = useState([]);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(true);
  const [feedbacksError, setFeedbacksError] = useState('');
  const [feedbackTypes, setFeedbackTypes] = useState([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);

  // Load feedback form types when component mounts
    const loadFeedbackTypes = async () => {
      try {
        setIsLoadingTypes(true);
        const response = await authAPI.getFeedbackFormTypes();
        const types = response.types || [];
        setFeedbackTypes(types);
        
        // Set default feedback type to first active type
        if (types.length > 0) {
          const firstActiveType = types.find(t => t.status === 'active') || types[0];
        // Only update if current type is not in the list or is inactive
        const currentTypeExists = types.find(t => t.value === feedbackType && t.status === 'active');
        if (!currentTypeExists) {
          setFeedbackType(firstActiveType.value);
        }
        }
      } catch (error) {
        console.error('Error loading feedback types:', error);
        // Fallback to default types if API fails
        const defaultTypes = [
          { name: 'General Feedback', value: 'general', status: 'active' },
          { name: 'Support Request', value: 'support', status: 'active' },
          { name: 'Property Viewing Inquiry', value: 'property_viewing', status: 'active' },
          { name: 'Price Quote Request', value: 'price_quote', status: 'active' }
        ];
        setFeedbackTypes(defaultTypes);
      } finally {
        setIsLoadingTypes(false);
      }
    };

  useEffect(() => {
    loadFeedbackTypes();
  }, []);

  // Refresh feedback types when window regains focus (e.g., after admin updates types)
  useEffect(() => {
    const handleFocus = () => {
      loadFeedbackTypes();
    };
    
    // Also refresh on visibility change (when tab becomes visible)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadFeedbackTypes();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Empty dependency array - only set up listeners once

  // Load user's own feedbacks from database when component mounts
  useEffect(() => {
    const loadMyFeedbacks = async () => {
      try {
        setIsLoadingFeedbacks(true);
        setFeedbacksError('');
        
        const response = await authAPI.getMyFeedbacks();
        setUserFeedbacks(response.feedbacks || []);
        
      } catch (error) {
        console.error('Error loading user feedbacks:', error);
        setFeedbacksError(error.message || 'Failed to load your feedbacks');
        setUserFeedbacks([]);
      } finally {
        setIsLoadingFeedbacks(false);
      }
    };

    loadMyFeedbacks();
  }, []);

  // Refresh feedback data when window regains focus (to show new admin responses)
  useEffect(() => {
    const handleFocus = () => {
      const loadMyFeedbacks = async () => {
      try {
          const response = await authAPI.getMyFeedbacks();
          setUserFeedbacks(response.feedbacks || []);
      } catch (error) {
          console.error('Error loading feedbacks:', error);
        }
      };
      loadMyFeedbacks();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      alert('Please enter your feedback message.');
      return;
    }
    
    try {
      // Submit feedback to backend
      const feedbackData = {
        inquiry_type: feedbackType, // 'general', 'support', 'property_viewing', 'price_quote'
        message: feedbackMessage,
        email: feedbackEmail || undefined
      };
      
      const response = await authAPI.submitFeedback(feedbackData);
      
      alert(response.message);
      
      // Reset form
      setFeedbackType('general');
      setFeedbackMessage('');
      setFeedbackEmail('');
      
      // Reload feedback list to get updated data from backend (including any admin responses)
      try {
        const feedbacksResponse = await authAPI.getMyFeedbacks();
        setUserFeedbacks(feedbacksResponse.feedbacks || []);
      } catch (error) {
        console.error('Error reloading feedbacks:', error);
      }
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  // Helper function to format time
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = Date.now();
    const feedbackDate = new Date(timestamp).getTime();
    const diff = now - feedbackDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Get status badge class - use admin_response to determine status
  const getStatusBadgeClass = (hasAdminResponse) => {
    return hasAdminResponse ? 'feedback-status-responded' : 'feedback-status-progress';
  };

  const getStatusText = (hasAdminResponse) => {
    return hasAdminResponse ? 'Responded' : 'In Progress';
  };
          
  // Get feedback type label
  const getFeedbackTypeLabel = (type) => {
    // Try to find the label from the loaded feedback types
    const typeObj = feedbackTypes.find(t => t.value === type);
    if (typeObj) {
      return typeObj.name;
        }
    
    // Fallback to hardcoded labels if types not loaded yet
    switch (type) {
      case 'general':
        return 'General Feedback';
      case 'support':
        return 'Support Request';
      case 'property_viewing':
        return 'Property Viewing Inquiry';
      case 'price_quote':
        return 'Price Quote Request';
      default:
        return type;
    }
  };

  return (
    <div className="user-dashboard">
      {/* Top Header */}
      <Header />

      <div className="user-dashboard-container">
        {/* Left Sidebar */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content */}
        <main className="user-main-content">
          {/* Feedback Section */}
          <section className="feedback-section">
            <h1 className="feedback-section-title">Feedback</h1>
            <h2 className="feedback-subtitle">Share Your Thoughts or Report Issues</h2>
            
            <div className="feedback-form">
              <div className="feedback-form-group">
                <label htmlFor="feedback-type" className="feedback-label">Feedback Type</label>
                <select
                  id="feedback-type"
                  className="feedback-select"
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  disabled={isLoadingTypes}
                >
                  {feedbackTypes
                    .filter(type => type.status === 'active')
                    .map(type => (
                      <option key={type.id || type.value} value={type.value}>
                        {type.name}
                      </option>
                    ))}
                  {feedbackTypes.length === 0 && !isLoadingTypes && (
                    <>
                      <option value="general">General Feedback</option>
                      <option value="support">Support Request</option>
                      <option value="property_viewing">Property Viewing Inquiry</option>
                      <option value="price_quote">Price Quote Request</option>
                    </>
                  )}
                </select>
              </div>

              <div className="feedback-form-group">
                <label htmlFor="feedback-message" className="feedback-label">Describe your feedback</label>
              <textarea
                  id="feedback-message"
                className="feedback-textarea"
                  placeholder="Please describe your feedback, issue, or inquiry in detail... (Max. 1000 characters)"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  maxLength={1000}
                  rows={6}
              />
              </div>
              <div className="feedback-char-count">{feedbackMessage.length}/1000</div>

              <div className="feedback-form-group">
                <label htmlFor="feedback-email" className="feedback-label">Email (optional)</label>
                <input
                  id="feedback-email"
                  type="email"
                  className="feedback-input"
                  placeholder="your.email@example.com"
                  value={feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                />
              </div>
              
              <button 
                className="feedback-submit-btn"
                onClick={handleSubmitFeedback}
              >
                Submit Feedback
              </button>
            </div>
          </section>

          {/* Your Past Feedback Section */}
          <section className="feedback-your-reviews-section">
            <h2 className="feedback-section-title">Your Past Feedback</h2>
            
            {feedbacksError && (
              <div className="feedback-error-message">
                {feedbacksError}
              </div>
            )}
            
            {isLoadingFeedbacks && (
              <div className="feedback-loading">
                <p>Loading your feedback...</p>
              </div>
            )}
            
            {!isLoadingFeedbacks && !feedbacksError && (
              <div className="feedback-reviews-list">
                {userFeedbacks.length > 0 ? (
                  userFeedbacks.map((feedback) => (
                    <div key={feedback.id} className="feedback-review-card">
                      <div className="feedback-review-header">
                        <div className="feedback-feedback-icon">💬</div>
                        <div className="feedback-reviewer-info">
                          <h3 className="feedback-reviewer-name">{getFeedbackTypeLabel(feedback.inquiry_type)}</h3>
                          <span className="feedback-review-time">{formatTime(feedback.created_at)}</span>
                          <span className={`feedback-status-badge ${getStatusBadgeClass(!!feedback.admin_response)}`}>
                            {getStatusText(!!feedback.admin_response)}
                          </span>
                        </div>
                      </div>
                      <p className="feedback-review-text">{feedback.message}</p>
                      
                      {feedback.admin_response && (
                        <div className="feedback-admin-response">
                          <div className="feedback-admin-response-header">
                            <span className="feedback-admin-response-label">Admin Response:</span>
                          </div>
                          <div className="feedback-admin-response-content">
                            <p className="feedback-admin-response-text">"{feedback.admin_response}"</p>
                            {feedback.admin_response_date && (
                              <span className="feedback-admin-response-date">
                                {new Date(feedback.admin_response_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="feedback-no-reviews">
                    <p>You haven't submitted any feedback yet.</p>
                    <p>Submit your first feedback using the form above!</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Feedback;
