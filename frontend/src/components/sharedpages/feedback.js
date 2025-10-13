import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import Header from './header';
import Navbar from './navbar';
import Footer from './footer';
import './feedback.css';

const Feedback = () => {
  const [activeTab, setActiveTab] = useState('feedback');
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  // Recent reviews from database (admin-published reviews)
  const [recentReviews, setRecentReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState('');

  // Track user interactions with reviews
  const [userInteractions, setUserInteractions] = useState({});

  // Track user interactions with admin replies
  const [adminReplyInteractions, setAdminReplyInteractions] = useState({});

  // Load user's interaction state from database when component mounts
  useEffect(() => {
    const loadUserInteractions = async () => {
      try {
        const response = await authAPI.getUserInteractions();
        setUserInteractions(response.interactions || {});
      } catch (error) {
        console.error('Error loading user interactions:', error);
        // Continue with empty interactions if API fails
      }
    };

    loadUserInteractions();
  }, []);

  // Load published reviews from database when component mounts
  useEffect(() => {
    const loadPublishedReviews = async () => {
      try {
        setIsLoadingReviews(true);
        setReviewsError('');
        
        const response = await authAPI.getPublishedReviews();
        setRecentReviews(response.reviews);
        
      } catch (error) {
        console.error('Error loading reviews:', error);
        setReviewsError(error.message || 'Failed to load reviews');
        
        // Fallback to empty array if API fails
        setRecentReviews([]);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    loadPublishedReviews();
  }, []);

  // Load user's own reviews from database when component mounts
  useEffect(() => {
    const loadMyReviews = async () => {
      try {
        setIsLoadingYourReviews(true);
        setYourReviewsError('');
        
        const response = await authAPI.getMyReviews();
        setYourReviews(response.reviews);
        
      } catch (error) {
        console.error('Error loading user reviews:', error);
        
        // Check if it's a database table issue
        if (error.message && error.message.includes('table') || error.message.includes('relation')) {
          setYourReviewsError('Reviews system is not set up yet. Please contact administrator.');
        } else {
          setYourReviewsError(error.message || 'Failed to load your reviews');
        }
        
        // Fallback to empty array if API fails
        setYourReviews([]);
      } finally {
        setIsLoadingYourReviews(false);
      }
    };

    loadMyReviews();
  }, []);

  // Helper function to format time
  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // User's own reviews from database
  const [yourReviews, setYourReviews] = useState([]);
  const [isLoadingYourReviews, setIsLoadingYourReviews] = useState(true);
  const [yourReviewsError, setYourReviewsError] = useState('');



  const handleRatingClick = (selectedRating) => {
    setRating(selectedRating);
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      alert('Please select a rating before submitting feedback.');
      return;
    }
    if (feedbackText.trim() === '') {
      alert('Please enter your feedback before submitting.');
      return;
    }
    
    try {
      // Submit feedback to backend
      const feedbackData = {
        rating: rating,
        review_text: feedbackText,
        review_type: 'platform'
      };
      
      const response = await authAPI.submitFeedback(feedbackData);
      
      // Create new review object for local display
      const newReview = {
        id: response.review_id,
        time: 'Just now',
        rating: rating,
        text: feedbackText,
        likes: 0,
        dislikes: 0,
        hasAdminReply: false
      };
      
      // Add new review to yourReviews
      setYourReviews(prevReviews => [newReview, ...prevReviews]);
      
      alert(response.message);
      
      // Reset form
      setRating(0);
      setFeedbackText('');
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  // Handle like button click for recent reviews
  const handleLikeClick = async (reviewId) => {
    try {
      // Call API to like/unlike review
      const response = await authAPI.likeReview(reviewId);
      
      // Update local state with new counts and interaction
      setRecentReviews(prevReviews => 
        prevReviews.map(review => {
          if (review.id === reviewId) {
            const currentInteraction = userInteractions[reviewId];
            
            // Update interaction state
            if (currentInteraction === 'like') {
              // User unliked
              setUserInteractions(prev => ({ ...prev, [reviewId]: null }));
            } else {
              // User liked or switched from dislike
              setUserInteractions(prev => ({ ...prev, [reviewId]: 'like' }));
            }
            
            // Update counts from API response
            return { ...review, likes: response.likes, dislikes: response.dislikes };
          }
          return review;
        })
      );
      
      // Update user interactions state
      if (userInteractions[reviewId] === 'like') {
        setUserInteractions(prev => ({ ...prev, [reviewId]: null }));
      } else {
        setUserInteractions(prev => ({ ...prev, [reviewId]: 'like' }));
      }
      
    } catch (error) {
      console.error('Error handling like:', error);
      alert('Failed to update like. Please try again.');
    }
  };

  // Handle dislike button click for recent reviews
  const handleDislikeClick = async (reviewId) => {
    try {
      // Call API to dislike/undislike review
      const response = await authAPI.dislikeReview(reviewId);
      
      // Update local state with new counts and interaction
      setRecentReviews(prevReviews => 
        prevReviews.map(review => {
          if (review.id === reviewId) {
            const currentInteraction = userInteractions[reviewId];
            
            // Update interaction state
            if (currentInteraction === 'dislike') {
              // User undisliked
              setUserInteractions(prev => ({ ...prev, [reviewId]: null }));
            } else {
              // User disliked or switched from like
              setUserInteractions(prev => ({ ...prev, [reviewId]: 'dislike' }));
            }
            
            // Update counts from API response
            return { ...review, likes: response.likes, dislikes: response.dislikes };
          }
          return review;
        })
      );
      
      // Update user interactions state
      if (userInteractions[reviewId] === 'dislike') {
        setUserInteractions(prev => ({ ...prev, [reviewId]: null }));
      } else {
        setUserInteractions(prev => ({ ...prev, [reviewId]: 'dislike' }));
      }
      
    } catch (error) {
      console.error('Error handling dislike:', error);
      alert('Failed to update dislike. Please try again.');
    }
  };

  // Handle like button click for your reviews
  const handleYourReviewLikeClick = async (reviewId) => {
    try {
      // Call API to like/unlike review
      const response = await authAPI.likeReview(reviewId);
      
      // Update local state with new counts and interaction
      setYourReviews(prevReviews => 
        prevReviews.map(review => {
          if (review.id === reviewId) {
            const currentInteraction = userInteractions[reviewId];
            
            // Update interaction state
            if (currentInteraction === 'like') {
              // User unliked
              setUserInteractions(prev => ({ ...prev, [reviewId]: null }));
            } else {
              // User liked or switched from dislike
              setUserInteractions(prev => ({ ...prev, [reviewId]: 'like' }));
            }
            
            // Update counts from API response
            return { ...review, likes: response.likes, dislikes: response.dislikes };
          }
          return review;
        })
      );
      
      // Update user interactions state
      if (userInteractions[reviewId] === 'like') {
        setUserInteractions(prev => ({ ...prev, [reviewId]: null }));
      } else {
        setUserInteractions(prev => ({ ...prev, [reviewId]: 'like' }));
      }
      
    } catch (error) {
      console.error('Error handling like:', error);
      alert('Failed to update like. Please try again.');
    }
  };

    // Handle dislike button click for your reviews
  const handleYourReviewDislikeClick = async (reviewId) => {
    try {
      // Call API to dislike/undislike review
      const response = await authAPI.dislikeReview(reviewId);
      
      // Update local state with new counts and interaction
      setYourReviews(prevReviews => 
        prevReviews.map(review => {
          if (review.id === reviewId) {
            const currentInteraction = userInteractions[reviewId];
            
            // Update interaction state
            if (currentInteraction === 'dislike') {
              // User undisliked
              setUserInteractions(prev => ({ ...prev, [reviewId]: null }));
            } else {
              // User disliked or switched from like
              setUserInteractions(prev => ({ ...prev, [reviewId]: 'dislike' }));
            }
            
            // Update counts from API response
            return { ...review, likes: response.likes, dislikes: response.dislikes };
          }
          return review;
        })
      );
      
      // Update user interactions state
      if (userInteractions[reviewId] === 'dislike') {
        setUserInteractions(prev => ({ ...prev, [reviewId]: null }));
      } else {
        setUserInteractions(prev => ({ ...prev, [reviewId]: 'dislike' }));
      }
      
    } catch (error) {
      console.error('Error handling dislike:', error);
      alert('Failed to update dislike. Please try again.');
    }
  };

  // Handle like button click for admin replies
  const handleAdminReplyLikeClick = (reviewId) => {
    setYourReviews(prevReviews => 
      prevReviews.map(review => {
        if (review.id === reviewId && review.hasAdminReply) {
          const currentInteraction = adminReplyInteractions[reviewId];
          
          // If user already liked this admin reply, remove the like
          if (currentInteraction === 'like') {
            setAdminReplyInteractions(prev => ({ ...prev, [reviewId]: null }));
            return { 
              ...review, 
              adminReply: { 
                ...review.adminReply, 
                likes: Math.max(0, (review.adminReply.likes || 0) - 1)
              } 
            };
          }
          
          // If user already disliked this admin reply, switch to like
          if (currentInteraction === 'dislike') {
            setAdminReplyInteractions(prev => ({ ...prev, [reviewId]: 'like' }));
            return { 
              ...review, 
              adminReply: { 
                ...review.adminReply, 
                likes: (review.adminReply.likes || 0) + 1,
                dislikes: Math.max(0, (review.adminReply.dislikes || 0) - 1)
              } 
            };
          }
          
          // If user hasn't interacted, add like
          setAdminReplyInteractions(prev => ({ ...prev, [reviewId]: 'like' }));
          return { 
            ...review, 
            adminReply: { 
              ...review.adminReply, 
              likes: (review.adminReply.likes || 0) + 1 
            } 
          };
        }
        return review;
      })
    );
  };

  // Handle dislike button click for admin replies
  const handleAdminReplyDislikeClick = (reviewId) => {
    setYourReviews(prevReviews => 
      prevReviews.map(review => {
        if (review.id === reviewId && review.hasAdminReply) {
          const currentInteraction = adminReplyInteractions[reviewId];
          
          // If user already disliked this admin reply, remove the dislike
          if (currentInteraction === 'dislike') {
            setAdminReplyInteractions(prev => ({ ...prev, [reviewId]: null }));
            return { 
              ...review, 
              adminReply: { 
                ...review.adminReply, 
                dislikes: Math.max(0, (review.adminReply.dislikes || 0) - 1)
              } 
            };
          }
          
          // If user already liked this admin reply, switch to dislike
          if (currentInteraction === 'like') {
            setAdminReplyInteractions(prev => ({ ...prev, [reviewId]: 'dislike' }));
            return { 
              ...review, 
              adminReply: { 
                ...review.adminReply, 
                likes: Math.max(0, (review.adminReply.likes || 0) - 1),
                dislikes: (review.adminReply.dislikes || 0) + 1
              } 
            };
          }
          
          // If user hasn't interacted, add dislike
          setAdminReplyInteractions(prev => ({ ...prev, [reviewId]: 'dislike' }));
          return { 
            ...review, 
            adminReply: { 
              ...review.adminReply, 
              dislikes: (review.adminReply.dislikes || 0) + 1 
            } 
          };
        }
        return review;
      })
    );
  };

  const renderStars = (rating, interactive = false) => {
    return (
      <div className="feedback-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className={`feedback-star-btn ${star <= rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
            onClick={interactive ? () => handleRatingClick(star) : undefined}
            disabled={!interactive}
          >
            ★
          </button>
        ))}
      </div>
    );
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
            <h2 className="feedback-subtitle">Rate Your Experience</h2>
            
            <div className="feedback-rating-section">
              {renderStars(rating, true)}
            </div>
            
            <div className="feedback-form">
              <textarea
                className="feedback-textarea"
                placeholder="Share your thoughts, suggestions, or issues here... (Max. 500 characters)"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                maxLength={500}
                rows={4}
              />
              <div className="feedback-char-count">{feedbackText.length}/500</div>
              
              <button 
                className="feedback-submit-btn"
                onClick={handleSubmitFeedback}
              >
                Submit Feedback
              </button>
            </div>
          </section>

          {/* Recent Reviews Section */}
          <section className="feedback-reviews-section">
            <h2 className="feedback-section-title">Recent Reviews</h2>
            
            {/* Error Message */}
            {reviewsError && (
              <div className="feedback-error-message">
                {reviewsError}
              </div>
            )}
            
            {/* Loading State */}
            {isLoadingReviews && (
              <div className="feedback-loading">
                <p>Loading reviews...</p>
              </div>
            )}
            
            {/* Reviews List */}
            {!isLoadingReviews && !reviewsError && (
              <div className="feedback-reviews-list">
                {recentReviews.length > 0 ? (
                  recentReviews.map((review) => (
                    <div key={review.id} className="feedback-review-card">
                      <div className="feedback-review-header">
                        <img src={review.image} alt={review.name} className="feedback-reviewer-image" />
                        <div className="feedback-reviewer-info">
                          <h3 className="feedback-reviewer-name">{review.name}</h3>
                          <span className="feedback-review-time">{review.time}</span>
                        </div>
                      </div>
                      <div className="feedback-review-rating">
                        {renderStars(review.rating)}
                      </div>
                      <p className="feedback-review-text">{review.text}</p>
                      
                      {/* Admin Response Display */}
                      {review.admin_response && (
                        <div className="feedback-admin-response">
                          <div className="feedback-admin-response-header">
                            <span className="feedback-admin-response-label">Admin Response:</span>
                          </div>
                          <div className="feedback-admin-response-content">
                            <p className="feedback-admin-response-text">"{review.admin_response}"</p>
                            {review.admin_response_date && (
                              <span className="feedback-admin-response-date">
                                {new Date(review.admin_response_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="feedback-review-engagement">
                        <button 
                          className={`feedback-engagement-btn ${userInteractions[review.id] === 'like' ? 'active' : ''}`}
                          onClick={() => handleLikeClick(review.id)}
                          title={userInteractions[review.id] === 'like' ? 'Remove like' : 'Like this review'}
                        >
                          <span className="feedback-engagement-icon">👍</span>
                          <span className="feedback-engagement-count">{review.likes}</span>
                        </button>
                        <button 
                          className={`feedback-engagement-btn ${userInteractions[review.id] === 'dislike' ? 'active' : ''}`}
                          onClick={() => handleDislikeClick(review.id)}
                          title={userInteractions[review.id] === 'dislike' ? 'Remove dislike' : 'Dislike this review'}
                        >
                          <span className="feedback-engagement-icon">👎</span>
                          <span className="feedback-engagement-count">{review.dislikes}</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="feedback-no-reviews">
                    <p>No reviews available at the moment.</p>
                  </div>
                )}
              </div>
            )}
          </section>

                    {/* Your Reviews Section */}
          <section className="feedback-your-reviews-section">
            <h2 className="feedback-section-title">Your Reviews</h2>
            
            {/* Error Message */}
            {yourReviewsError && (
              <div className="feedback-error-message">
                {yourReviewsError}
              </div>
            )}
            
            {/* Loading State */}
            {isLoadingYourReviews && (
              <div className="feedback-loading">
                <p>Loading your reviews...</p>
              </div>
            )}
            
            {/* Reviews List */}
            {!isLoadingYourReviews && !yourReviewsError && (
              <div className="feedback-reviews-list">
                {yourReviews.length > 0 ? (
                  yourReviews.map((review) => (
                    <div key={review.id} className="feedback-review-card your-review">
                      <div className="feedback-review-header">
                        <div className="feedback-reviewer-image you">You</div>
                        <div className="feedback-reviewer-info">
                          <h3 className="feedback-reviewer-name">You</h3>
                          <span className="feedback-review-time">{review.time}</span>
                          {review.is_verified && (
                            <span className="feedback-review-status verified">✓ Published</span>
                          )}
                          {!review.is_verified && (
                            <span className="feedback-review-status pending">⏳ Pending Review</span>
                          )}
                        </div>
                      </div>
                      <div className="feedback-review-rating">
                        {renderStars(review.rating)}
                      </div>
                      <p className="feedback-review-text">{review.text}</p>
                      
                      {/* Admin Response Display */}
                      {review.admin_response && (
                        <div className="feedback-admin-response">
                          <div className="feedback-admin-response-header">
                            <span className="feedback-admin-response-label">Admin Response:</span>
                          </div>
                          <div className="feedback-admin-response-content">
                            <p className="feedback-admin-response-text">"{review.admin_response}"</p>
                            {review.admin_response_date && (
                              <span className="feedback-admin-response-date">
                                {new Date(review.admin_response_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="feedback-review-engagement">
                        <button 
                          className={`feedback-engagement-btn ${userInteractions[review.id] === 'like' ? 'active' : ''}`}
                          onClick={() => handleYourReviewLikeClick(review.id)}
                          title={userInteractions[review.id] === 'like' ? 'Remove like' : 'Like this review'}
                        >
                          <span className="feedback-engagement-icon">👍</span>
                                                     <span className="feedback-engagement-count">{review.likes}</span>
                        </button>
                        <button 
                          className={`feedback-engagement-btn ${userInteractions[review.id] === 'dislike' ? 'active' : ''}`}
                          onClick={() => handleYourReviewDislikeClick(review.id)}
                          title={userInteractions[review.id] === 'dislike' ? 'Remove dislike' : 'Dislike this review'}
                        >
                          <span className="feedback-engagement-icon">👎</span>
                          <span className="feedback-engagement-count">{review.dislikes}</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="feedback-no-reviews">
                    <p>You haven't submitted any reviews yet.</p>
                    <p>Submit your first review using the form above!</p>
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
