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
  const [activeTab, setActiveTab] = useState('feedback');
  
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
      fetchFeedbackData();
    }
  }, [feedbackId]);

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch feedback details by ID
      const feedbackResponse = await authAPI.getFeedbackById(feedbackId);
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
      
      // Call the API to respond to feedback
      await authAPI.respondToFeedback(feedbackId, finalResponse);
      
      // Show success message and redirect back to feedback management
      alert('Response sent successfully!');
      navigate('/dashboard/feedback-management');
      
    } catch (error) {
      console.error('Failed to send response:', error);
      setError('Failed to send response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/feedback-management');
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
            <h1 className="user-main-title">Respond to Feedback</h1>
          </div>
          
          <div className="respond-feedback-content">
            {/* Feedback Preview Section */}
            <section className="respond-feedback-preview-section">
              <h2>Feedback Details</h2>
              <div className="respond-feedback-preview-card">
                <div className="respond-feedback-user-info">
                  <h3>From: {feedback.user_name}</h3>
                  <p className="respond-feedback-user-email">{feedback.user_email}</p>
                  <p className="respond-feedback-date">
                    Submitted: {feedback.review_date ? new Date(feedback.review_date).toLocaleDateString() : 'No date'}
                  </p>
                </div>
                
                <div className="respond-feedback-rating">
                  <span>Rating: </span>
                  {renderStars(feedback.rating)}
                </div>
                
                <div className="respond-feedback-text">
                  <h4>Feedback:</h4>
                  <p>"{feedback.review_text}"</p>
                </div>
                
                <div className="respond-feedback-status">
                  <span className={`respond-feedback-status-badge ${feedback.is_verified ? 'verified' : 'pending'}`}>
                    {feedback.is_verified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
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
