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
  const [activeTab, setActiveTab] = useState('feedback');
  
  // State for feedback data
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      
    } catch (err) {
      console.error('Error fetching feedback data:', err);
      setError(err.message || 'Failed to fetch feedback data');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/dashboard/feedback-management');
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
            <h1 className="user-main-title">View Feedback Details</h1>
          </div>
          
          <div className="view-feedback-content">
            {/* Feedback Details Section */}
            <section className="view-feedback-details-section">
              <h2>Feedback Information</h2>
              <div className="view-feedback-details-card">
                <div className="view-feedback-user-info">
                  <h3>From: {feedback.user_name}</h3>
                  <p className="view-feedback-user-email">{feedback.user_email}</p>
                  <p className="view-feedback-date">
                    Submitted: {feedback.review_date ? new Date(feedback.review_date).toLocaleDateString() : 'No date'}
                  </p>
                </div>
                
                <div className="view-feedback-rating">
                  <span>Rating: </span>
                  {renderStars(feedback.rating)}
                </div>
                
                <div className="view-feedback-text">
                  <h4>Feedback:</h4>
                  <p>"{feedback.review_text}"</p>
                </div>
                
                <div className="view-feedback-status">
                  <span className={`view-feedback-status-badge ${feedback.is_verified ? 'verified' : 'pending'}`}>
                    {feedback.is_verified ? 'Published on Homepage' : 'Private'}
                  </span>
                </div>
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
                Back to Feedback List
              </button>
              {!feedback.admin_response && (
                <button 
                  className="view-feedback-respond-btn"
                  onClick={() => navigate(`/dashboard/respond-to-feedback/${feedbackId}`)}
                >
                  Respond to Feedback
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
