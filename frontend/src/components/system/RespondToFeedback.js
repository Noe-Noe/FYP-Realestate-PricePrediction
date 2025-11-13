import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './RespondToFeedback.css';

const RespondToFeedback = () => {
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
  
  // State for response form
  const [adminResponse, setAdminResponse] = useState('');
  const [selectedDefaultResponse, setSelectedDefaultResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Default response options
  const defaultResponses = [
    'Thank you for your feedback! We appreciate you taking the time to share your experience.',
    'We\'re glad you had a positive experience with our platform. Thank you for your review!',
    'Thank you for your feedback. We\'re continuously working to improve our services.',
    'We appreciate your input. Your feedback helps us serve our users better.',
    'Thank you for sharing your thoughts. We value your perspective and will use it to improve.',
    'We\'re sorry to hear about your experience. We\'ll address this issue promptly.',
    'Thank you for bringing this to our attention. We\'ll investigate and resolve this matter.',
    'We appreciate your patience and understanding. We\'re working to resolve this issue.'
  ];

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
      
      // If there's already an admin response, populate it
      if (feedbackResponse.admin_response) {
        setAdminResponse(feedbackResponse.admin_response);
      }
      
    } catch (err) {
      console.error('Error fetching feedback data:', err);
      setError(err.message || 'Failed to fetch feedback data');
    } finally {
      setLoading(false);
    }
  };

  const handleDefaultResponseSelect = (response) => {
    setSelectedDefaultResponse(response);
    setAdminResponse(''); // Clear custom response when default is selected
  };

  const handleCustomResponseChange = (e) => {
    setAdminResponse(e.target.value);
    setSelectedDefaultResponse(''); // Clear default selection when typing custom
  };

  const handleSubmitResponse = async () => {
    try {
      // Use selected default response if chosen, otherwise use custom response
      const finalResponse = selectedDefaultResponse || adminResponse;
      
      if (!finalResponse.trim()) {
        setError('Please provide a response message');
        return;
      }
      
      setSubmitting(true);
      
      // Check URL params to determine type
      const urlParams = new URLSearchParams(window.location.search);
      const type = urlParams.get('type') || 'review';
      
      // Call the API to respond to feedback/review
      await authAPI.respondToFeedback(feedbackId, finalResponse, type);
      
      // Reload feedback data to show the updated response
      await fetchFeedbackData();
      
      // Show success message but stay on page to allow viewing/editing
      alert('Response sent successfully! You can continue viewing or editing the response.');
      
    } catch (error) {
      console.error('Failed to send response:', error);
      setError('Failed to send response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
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
        <span key={i} className={`respond-feedback-star ${i <= rating ? 'filled' : 'empty'}`}>
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
            <div className="respond-feedback-loading">Loading feedback data...</div>
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
            <div className="respond-feedback-error">
              Error: {error}
              <button onClick={fetchFeedbackData} className="respond-feedback-retry-btn">
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
            <div className="respond-feedback-error">Feedback not found</div>
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
                return type === 'review' ? 'Respond to Review' : 'Respond to Feedback';
              })()}
            </h1>
          </div>
          
          <div className="respond-feedback-content">
            {/* Feedback Preview Section */}
            <section className="respond-feedback-preview-section">
              <h2>{feedback?.rating ? 'Review' : 'Feedback'} Details</h2>
              <div className="respond-feedback-preview-card">
                <div className="respond-feedback-user-info">
                  <h3>From: {feedback.user_name}</h3>
                  <p className="respond-feedback-user-email">{feedback.user_email}</p>
                  <p className="respond-feedback-date">
                    Submitted: {(feedback.review_date || feedback.created_at) ? new Date(feedback.review_date || feedback.created_at).toLocaleDateString() : 'No date'}
                  </p>
                </div>
                
                {feedback.rating && (
                <div className="respond-feedback-rating">
                  <span>Rating: </span>
                  {renderStars(feedback.rating)}
                </div>
                )}
                
                {feedback.inquiry_type && (
                  <div className="respond-feedback-inquiry-type">
                    <span>Type: </span>
                    <span className="respond-feedback-inquiry-type-badge">
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
                
                {feedback.status && (
                  <div className="respond-feedback-status">
                    <span>Status: </span>
                    <span className={`respond-feedback-status-badge ${feedback.status}`}>
                      {feedback.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div className="respond-feedback-text">
                  <h4>{feedback.rating ? 'Review:' : 'Message:'}</h4>
                  <p>"{feedback.review_text || feedback.message}"</p>
                </div>
                
                {feedback.is_verified !== undefined && (
                  <div className="respond-feedback-verification-status">
                  <span className={`respond-feedback-status-badge ${feedback.is_verified ? 'verified' : 'pending'}`}>
                    {feedback.is_verified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
                )}
              </div>
            </section>

            {/* Response Section */}
            <section className="respond-feedback-response-section">
              <h2>Admin Response</h2>
              
              {/* Default Response Options */}
              <div className="respond-feedback-default-responses">
                <label>Choose a default response:</label>
                <select 
                  value={selectedDefaultResponse}
                  onChange={(e) => handleDefaultResponseSelect(e.target.value)}
                  className="respond-feedback-default-select"
                >
                  <option value="">-- Select a default response --</option>
                  {defaultResponses.map((response, index) => (
                    <option key={index} value={response}>
                      {response.length > 60 ? response.substring(0, 60) + '...' : response}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Custom Response */}
              <div className="respond-feedback-custom-response">
                <label>Or write a custom response:</label>
              <textarea
                  value={adminResponse}
                  onChange={handleCustomResponseChange}
                  placeholder="Type your custom response here..."
                  className="respond-feedback-response-textarea"
                  rows={6}
                />
              </div>

              {/* Current Response Display */}
              {feedback.admin_response && (
                <div className="respond-feedback-current-response">
                  <h4>Current Response:</h4>
                  <p className="respond-feedback-current-response-text">
                    "{feedback.admin_response}"
                  </p>
                  <p className="respond-feedback-current-response-date">
                    Sent on: {feedback.admin_response_date ? new Date(feedback.admin_response_date).toLocaleDateString() : 'Unknown date'}
                  </p>
                </div>
              )}
            </section>

            {/* Action Buttons */}
            <section className="respond-feedback-actions">
              <button 
                className="respond-feedback-cancel-btn"
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                className="respond-feedback-submit-btn"
                onClick={handleSubmitResponse}
                disabled={(!selectedDefaultResponse && !adminResponse.trim()) || submitting}
              >
                {submitting ? 'Sending...' : 'Send Response'}
              </button>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default RespondToFeedback;
