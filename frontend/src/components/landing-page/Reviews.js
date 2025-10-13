import React, { useState, useEffect, useMemo, memo } from 'react';
import api from '../../services/api';
import './Reviews.css';

const Reviews = memo(() => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const reviewsPerPage = 3;

  // Fetch verified reviews on component mount - only once
  useEffect(() => {
    if (!isInitialized) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        fetchVerifiedReviews();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isInitialized]);

  const fetchVerifiedReviews = async () => {
    try {
      setLoading(true);
      setIsInitialized(true);
      
      const response = await api.reviews.getVerifiedReviews();
      
      if (response.success && response.data) {
        // Transform the data to match the expected format
        const transformedReviews = response.data.map(review => ({
          id: review.id,
          title: getReviewTitle(review.rating),
          content: review.review_text,
          rating: review.rating,
          authorName: review.author_name,
          authorRole: review.author_role,
          reviewDate: review.review_date,
          adminResponse: review.admin_response
        }));
        
        // Add a small delay to ensure smooth transition
        await new Promise(resolve => setTimeout(resolve, 300));
        setReviews(transformedReviews);
      } else {
        // Fallback to empty array if no reviews found
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching verified reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate a title based on rating
  const getReviewTitle = (rating) => {
    const titles = {
      5: "Excellent",
      4: "Great",
      3: "Good",
      2: "Fair",
      1: "Poor"
    };
    return titles[rating] || "Review";
  };


  const totalPages = useMemo(() => Math.ceil(reviews.length / reviewsPerPage), [reviews.length, reviewsPerPage]);
  
  const visibleReviews = useMemo(() => 
    reviews.slice(
      currentPage * reviewsPerPage,
      currentPage * reviewsPerPage + reviewsPerPage
    ), [reviews, currentPage, reviewsPerPage]
  );
  
  return (
    <section className="reviews-section" id="reviews">
      <div className="reviews-container">
        <div className="reviews-header">
          <h2 className="section-title">People Love Valuing with Valuez</h2>
        </div>
        
        {loading ? (
          <div className="reviews-loading">
            <div className="skeleton-loader">
              <div className="skeleton-review-card">
                <div className="skeleton-header"></div>
                <div className="skeleton-content"></div>
                <div className="skeleton-rating"></div>
                <div className="skeleton-author"></div>
              </div>
              <div className="skeleton-review-card">
                <div className="skeleton-header"></div>
                <div className="skeleton-content"></div>
                <div className="skeleton-rating"></div>
                <div className="skeleton-author"></div>
              </div>
              <div className="skeleton-review-card">
                <div className="skeleton-header"></div>
                <div className="skeleton-content"></div>
                <div className="skeleton-rating"></div>
                <div className="skeleton-author"></div>
              </div>
            </div>
            <div className="loading-text">Loading reviews...</div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="reviews-empty">
            <p>No verified reviews available at the moment.</p>
          </div>
        ) : (
          <>
            <div className={`reviews-carousel ${currentPage === totalPages - 1 ? 'centered' : ''} ${loading ? 'loading' : ''}`}>
              {visibleReviews.map((review, index) => (
                <div className="review-card" key={review.id || index}>
                  <div className="review-header">
                    <h3 className="review-title">{review.title}</h3>
                    <div className="review-quote">❝</div>
                  </div>
                  <div className="review-content">
                    <p>{review.content}</p>
                    {review.adminResponse && (
                      <div className="admin-response">
                        <p><strong>Admin Response:</strong> {review.adminResponse}</p>
                      </div>
                    )}
                  </div>
                  <div className="review-rating">
                    <div className="stars">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={`star ${i < review.rating ? 'filled' : ''}`}>★</span>
                      ))}
                    </div>
                  </div>
                  <div className="review-author">
                    <div className="author-avatar">
                      <div className="avatar-placeholder">
                        {review.authorName ? review.authorName.charAt(0).toUpperCase() : '?'}
                      </div>
                    </div>
                    <div className="author-info">
                      <h4 className="author-name">{review.authorName}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="reviews-dots">
                {Array.from({ length: totalPages }).map((_, pageIndex) => (
                  <span
                    key={pageIndex}
                    className={`dot ${pageIndex === currentPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageIndex)}
                  ></span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
});

export default Reviews;