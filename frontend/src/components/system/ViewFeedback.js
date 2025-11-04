import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './ViewFeedback.css';

const ViewFeedback = () => {
  const { feedbackId } = useParams();
  const navigate = useNavigate();
  
  // Determine active tab based on URL type parameter
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type') || 'review';
  const [activeTab, setActiveTab] = useState(type === 'review' ? 'review' : 'feedback');
  
  // State for feedback data
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch feedback data on component mount
  useEffect(() => {
    if (feedbackId) {
      // Update activeTab when component mounts based on URL type
      const currentUrlParams = new URLSearchParams(window.location.search);
      const currentType = currentUrlParams.get('type') || 'review';
      setActiveTab(currentType === 'review' ? 'review' : 'feedback');
      fetchFeedbackData();
    }
  }, [feedbackId]);

  // Refresh data when window regains focus (user navigates back from respond page)
  useEffect(() => {
    const handleFocus = () => {
      if (feedbackId) {
        fetchFeedbackData();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [feedbackId]);

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check URL params to determine if this is a review or feedback
      const urlParams = new URLSearchParams(window.location.search);
      const type = urlParams.get('type') || 'review';
      
      // Fetch feedback/review details by ID
      const feedbackResponse = await authAPI.getFeedbackById(feedbackId, type);
      setFeedback(feedbackResponse);
      
    } catch (err) {
      console.error('Error fetching feedback data:', err);
      setError(err.message || 'Failed to fetch feedback data');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Check URL params to determine if this is from review or feedback management
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    
    if (type === 'review') {
      navigate('/dashboard/review-management');
    } else {
    navigate('/dashboard/feedback-management');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`view-feedback-star ${i <= rating ? 'filled' : 'empty'}`}>
          ★
        </span>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="user-dashboard">
        <Header />
        <div className="user-dashboard-container">
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="user-main-content">
            <div className="view-feedback-loading">Loading feedback data...</div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-dashboard">
        <Header />
        <div className="user-dashboard-container">
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="user-main-content">
            <div className="view-feedback-error">
              Error: {error}
              <button onClick={fetchFeedbackData} className="view-feedback-retry-btn">
                Retry
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="user-dashboard">
        <Header />
        <div className="user-dashboard-container">
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="user-main-content">
            <div className="view-feedback-error">Feedback not found</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          <div className="user-content-header" style={{ marginBottom: 0 }}>
            <h1 className="user-main-title">
              {(() => {
                const urlParams = new URLSearchParams(window.location.search);
                const type = urlParams.get('type');
                return type === 'review' ? 'View Review Details' : 'View Feedback Details';
              })()}
            </h1>
          </div>
          
          <div className="view-feedback-content">
            {/* Feedback Details Section */}
            <section className="view-feedback-details-section">
              <h2>{feedback?.rating ? 'Review' : 'Feedback'} Information</h2>
              <div className="view-feedback-details-card">
                <div className="view-feedback-user-info">
                  <h3>From: {feedback.user_name}</h3>
                  <p className="view-feedback-user-email">{feedback.user_email}</p>
                  <p className="view-feedback-date">
                    Submitted: {(feedback.review_date || feedback.created_at) ? new Date(feedback.review_date || feedback.created_at).toLocaleDateString() : 'No date'}
                  </p>
                </div>
                
                {feedback.rating && (
                <div className="view-feedback-rating">
                  <span>Rating: </span>
                  {renderStars(feedback.rating)}
                </div>
                )}
                
                {feedback.inquiry_type && (
                  <div className="view-feedback-inquiry-type">
                    <span>Type: </span>
                    <span className="view-feedback-inquiry-type-badge">
                      {(() => {
                        switch(feedback.inquiry_type) {
                          case 'general': return 'General Feedback';
                          case 'support': return 'Support Request';
                          case 'property_viewing': return 'Property Viewing Inquiry';
                          case 'price_quote': return 'Price Quote Request';
                          default: return feedback.inquiry_type;
                        }
                      })()}
                    </span>
                  </div>
                )}
                
                {/* Show status - for feedback, show "Responded" or "In Progress" based on admin_response */}
                {feedback.type === 'feedback' && (
                  <div className="view-feedback-status-section">
                    <span>Status: </span>
                    <span className={`view-feedback-status-badge ${feedback.admin_response ? 'responded' : 'pending'}`}>
                      {feedback.admin_response ? 'Responded' : 'In Progress'}
                    </span>
                  </div>
                )}
                
                {/* For reviews, show status if needed (currently reviews don't use status field) */}
                {feedback.type === 'review' && feedback.status && (
                  <div className="view-feedback-status-section">
                    <span>Status: </span>
                    <span className={`view-feedback-status-badge ${feedback.status}`}>
                      {feedback.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div className="view-feedback-text">
                  <h4>{feedback.rating ? 'Review:' : 'Message:'}</h4>
                  <p>"{feedback.review_text || feedback.message}"</p>
                </div>
                
                {/* Show verification status only for reviews (not feedback) */}
                {feedback.type === 'review' && feedback.is_verified !== undefined && (
                  <div className="view-feedback-verification-status">
                  <span className={`view-feedback-status-badge ${feedback.is_verified ? 'verified' : 'pending'}`}>
                      {feedback.is_verified ? 'Published on Homepage' : 'Private (Not Published)'}
                  </span>
                </div>
                )}
              </div>
            </section>

            {/* Admin Response Section (if exists) */}
            {feedback.admin_response && (
              <section className="view-feedback-response-section">
                <h2>Admin Response</h2>
                <div className="view-feedback-response-card">
                  <div className="view-feedback-response-content">
                    <p className="view-feedback-response-text">
                      "{feedback.admin_response}"
                    </p>
                    <p className="view-feedback-response-date">
                      Sent on: {feedback.admin_response_date ? new Date(feedback.admin_response_date).toLocaleDateString() : 'Unknown date'}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Verification Details Section (if verified) */}
            {feedback.is_verified && (
              <section className="view-feedback-verification-section">
                <h2>Publication Details</h2>
                <div className="view-feedback-verification-card">
                                  <div className="view-feedback-verification-info">
                  <p><strong>Status:</strong> Published on Homepage</p>
                  <p><strong>Published on:</strong> {feedback.review_date ? new Date(feedback.review_date).toLocaleDateString() : 'Unknown date'}</p>
                  <p><strong>Published by:</strong> Admin</p>
                </div>
                </div>
              </section>
            )}

            {/* Action Buttons */}
            <section className="view-feedback-actions">
              <button 
                className="view-feedback-back-to-list-btn"
                onClick={handleBack}
              >
                Back to List
              </button>
              {!feedback.admin_response ? (
                <button 
                  className="view-feedback-respond-btn"
                  onClick={() => navigate(`/dashboard/respond-to-feedback/${feedbackId}${window.location.search || ''}`)}
                >
                  Respond
                </button>
              ) : (
                <button 
                  className="view-feedback-respond-btn"
                  onClick={() => navigate(`/dashboard/respond-to-feedback/${feedbackId}${window.location.search || ''}`)}
                >
                  Edit Response
                </button>
              )}
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default ViewFeedback;
