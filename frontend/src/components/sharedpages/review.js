import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import Header from './header';
import Navbar from './navbar';
import Footer from './footer';
import './feedback.css'; // Reuse feedback CSS styles

const Review = () => {
  const [activeTab, setActiveTab] = useState('review');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  // Recent reviews from database (admin-published reviews)
  const [recentReviews, setRecentReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState('');

  // Track user interactions with reviews
  const [userInteractions, setUserInteractions] = useState({});

  // Track user interactions with admin replies
  const [adminReplyInteractions, setAdminReplyInteractions] = useState({});

  // User's own reviews from database
  const [yourReviews, setYourReviews] = useState([]);
  const [isLoadingYourReviews, setIsLoadingYourReviews] = useState(true);
  const [yourReviewsError, setYourReviewsError] = useState('');

  // Review statistics (overall rating, total reviews, star distribution)
  const [reviewStats, setReviewStats] = useState({
    total_reviews: 0,
    average_rating: 0,
    star_distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
    star_percentages: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Load user's interaction state from database when component mounts
  useEffect(() => {
    const loadUserInteractions = async () => {
      try {
        const response = await authAPI.getUserInteractions();
        setUserInteractions(response.interactions || {});
      } catch (error) {
        console.error('Error loading user interactions:', error);
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
        if (error.message && (error.message.includes('table') || error.message.includes('relation'))) {
          setYourReviewsError('Reviews system is not set up yet. Please contact administrator.');
        } else {
          setYourReviewsError(error.message || 'Failed to load your reviews');
        }
        setYourReviews([]);
      } finally {
        setIsLoadingYourReviews(false);
      }
    };

    loadMyReviews();
  }, []);

  // Load review statistics when component mounts
  useEffect(() => {
    const loadReviewStatistics = async () => {
      try {
        setIsLoadingStats(true);
        const response = await authAPI.getReviewStatistics();
        setReviewStats(response);
      } catch (error) {
        console.error('Error loading review statistics:', error);
        // Set default values on error
        setReviewStats({
          total_reviews: 0,
          average_rating: 0,
          star_distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
          star_percentages: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
        });
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadReviewStatistics();
  }, []);

  // Helper function to format time
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = Date.now();
    const reviewDate = new Date(timestamp).getTime();
    const diff = now - reviewDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleRatingClick = (selectedRating) => {
    setRating(selectedRating);
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert('Please select a rating before submitting review.');
      return;
    }
    if (reviewText.trim() === '') {
      alert('Please enter your review before submitting.');
      return;
    }
    
    try {
      // Submit review to backend
      const reviewData = {
        rating: rating,
        review_text: reviewText,
        review_type: 'platform'
      };
      
      const response = await authAPI.submitReview(reviewData);
      
      // Create new review object for local display
      const newReview = {
        id: response.review_id,
        time: 'Just now',
        rating: rating,
        text: reviewText,
        likes: 0,
        dislikes: 0,
        hasAdminReply: false,
        review_date: new Date().toISOString()
      };
      
      // Add new review to yourReviews
      setYourReviews(prevReviews => [newReview, ...prevReviews]);
      
      // Reload review statistics
      try {
        const statsResponse = await authAPI.getReviewStatistics();
        setReviewStats(statsResponse);
      } catch (statsError) {
        console.error('Error reloading review statistics:', statsError);
      }
      
      alert(response.message);
      
      // Reset form
      setRating(0);
      setReviewText('');
      
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  // Handle like button click for recent reviews
  const handleLikeClick = async (reviewId) => {
    try {
      if (userInteractions[reviewId] === 'like') {
        // Already liked, remove like
        await authAPI.dislikeReview(reviewId);
        setRecentReviews(prevReviews =>
          prevReviews.map(review =>
            review.id === reviewId
              ? { ...review, likes: Math.max(0, (review.likes || 0) - 1) }
              : review
          )
        );
        setUserInteractions(prev => {
          const newInteractions = { ...prev };
          delete newInteractions[reviewId];
          return newInteractions;
        });
      } else {
        // Like the review
        await authAPI.likeReview(reviewId);
        setRecentReviews(prevReviews =>
          prevReviews.map(review => {
            if (review.id === reviewId) {
              if (userInteractions[reviewId] === 'dislike') {
                return {
                  ...review,
                  likes: (review.likes || 0) + 1,
                  dislikes: Math.max(0, (review.dislikes || 0) - 1)
                };
              }
              return { ...review, likes: (review.likes || 0) + 1 };
            }
            return review;
          })
        );
        setUserInteractions(prev => ({ ...prev, [reviewId]: 'like' }));
      }
    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  // Handle dislike button click for recent reviews
  const handleDislikeClick = async (reviewId) => {
    try {
      if (userInteractions[reviewId] === 'dislike') {
        // Already disliked, remove dislike
        await authAPI.likeReview(reviewId);
        setRecentReviews(prevReviews =>
          prevReviews.map(review =>
            review.id === reviewId
              ? { ...review, dislikes: Math.max(0, (review.dislikes || 0) - 1) }
              : review
          )
        );
        setUserInteractions(prev => {
          const newInteractions = { ...prev };
          delete newInteractions[reviewId];
          return newInteractions;
        });
      } else {
        // Dislike the review
        await authAPI.dislikeReview(reviewId);
        setRecentReviews(prevReviews =>
          prevReviews.map(review => {
            if (review.id === reviewId) {
              if (userInteractions[reviewId] === 'like') {
                return {
                  ...review,
                  dislikes: (review.dislikes || 0) + 1,
                  likes: Math.max(0, (review.likes || 0) - 1)
                };
              }
              return { ...review, dislikes: (review.dislikes || 0) + 1 };
            }
            return review;
          })
        );
        setUserInteractions(prev => ({ ...prev, [reviewId]: 'dislike' }));
      }
    } catch (error) {
      console.error('Error disliking review:', error);
    }
  };

  const handleYourReviewLikeClick = async (reviewId) => {
    // Similar logic for your reviews
    await handleLikeClick(reviewId);
    // Also update yourReviews state
  };

  const handleYourReviewDislikeClick = async (reviewId) => {
    // Similar logic for your reviews
    await handleDislikeClick(reviewId);
    // Also update yourReviews state
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

  // Render star rating display (can show half stars)
  const renderStarDisplay = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<span key={i} className="review-star-full">★</span>);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<span key={i} className="review-star-half">★</span>);
      } else {
        stars.push(<span key={i} className="review-star-empty">☆</span>);
      }
    }
    return <div className="review-stars-display">{stars}</div>;
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
          {/* Overall Review Summary Section */}
          <section className="review-summary-section">
            <h1 className="feedback-section-title">Website Review</h1>
            
            <div className="review-summary-container">
              {/* Overall Rating */}
              <div className="review-overall-rating">
                <div className="review-rating-number">{reviewStats.average_rating.toFixed(1)}</div>
                {renderStarDisplay(reviewStats.average_rating)}
                <div className="review-total-count">{reviewStats.total_reviews} reviews</div>
              </div>

              {/* Star Distribution */}
              <div className="review-star-distribution">
                {[5, 4, 3, 2, 1].map((starLevel) => {
                  const count = reviewStats.star_distribution[starLevel] || 0;
                  const percentage = reviewStats.star_percentages[starLevel] || 0;
                  
                  return (
                    <div key={starLevel} className="review-distribution-row">
                      <div className="review-distribution-label">
                        <span className="review-distribution-star-count">{starLevel}</span>
                        <span className="review-distribution-star-icon">★</span>
                      </div>
                      <div className="review-distribution-bar-container">
                        <div 
                          className="review-distribution-bar"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="review-distribution-count">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Review Submission Section */}
          <section className="feedback-section">
            <h2 className="feedback-subtitle">Rate Your Experience</h2>
            
            <div className="feedback-rating-section">
              {renderStars(rating, true)}
            </div>
            
            <div className="feedback-form">
              <textarea
                className="feedback-textarea"
                placeholder="Share your review about the platform here... (Max. 500 characters)"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={500}
                rows={4}
              />
              <div className="feedback-char-count">{reviewText.length}/500</div>
              
              <button 
                className="feedback-submit-btn"
                onClick={handleSubmitReview}
              >
                Submit Review
              </button>
            </div>
          </section>

          {/* Recent Reviews Section */}
          <section className="feedback-reviews-section">
            <h2 className="feedback-section-title">Recent Reviews</h2>
            
            {reviewsError && (
              <div className="feedback-error-message">
                {reviewsError}
              </div>
            )}
            
            {isLoadingReviews && (
              <div className="feedback-loading">
                <p>Loading reviews...</p>
              </div>
            )}
            
            {!isLoadingReviews && !reviewsError && (
              <div className="feedback-reviews-list">
                {recentReviews.length > 0 ? (
                  recentReviews.map((review) => (
                    <div key={review.id} className="feedback-review-card">
                      <div className="feedback-review-header">
                        <img src={review.image} alt={review.name} className="feedback-reviewer-image" />
                        <div className="feedback-reviewer-info">
                          <h3 className="feedback-reviewer-name">{review.name}</h3>
                          <span className="feedback-review-time">{review.time || formatTime(review.review_date)}</span>
                        </div>
                      </div>
                      <div className="feedback-review-rating">
                        {renderStars(review.rating)}
                      </div>
                      <p className="feedback-review-text">{review.text}</p>
                      
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
            
            {yourReviewsError && (
              <div className="feedback-error-message">
                {yourReviewsError}
              </div>
            )}
            
            {isLoadingYourReviews && (
              <div className="feedback-loading">
                <p>Loading your reviews...</p>
              </div>
            )}
            
            {!isLoadingYourReviews && !yourReviewsError && (
              <div className="feedback-reviews-list">
                {yourReviews.length > 0 ? (
                  yourReviews.map((review) => (
                    <div key={review.id} className="feedback-review-card your-review">
                      <div className="feedback-review-header">
                        <div className="feedback-reviewer-image you">You</div>
                        <div className="feedback-reviewer-info">
                          <h3 className="feedback-reviewer-name">You</h3>
                          <span className="feedback-review-time">{review.time || formatTime(review.review_date)}</span>
                        </div>
                      </div>
                      <div className="feedback-review-rating">
                        {renderStars(review.rating)}
                      </div>
                      <p className="feedback-review-text">{review.text}</p>
                      
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

export default Review;

