import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './ReviewManagement.css';

const ReviewManagement = () => {
  const [activeTab, setActiveTab] = useState('review');
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [filterLegit, setFilterLegit] = useState(false); // ML filter toggle
  
  // State for real data
  const [reviewList, setReviewList] = useState([]);
  const [reviewStats, setReviewStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [mlEnabled, setMlEnabled] = useState(false);
  const [reviewStatistics, setReviewStatistics] = useState({
    rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  // Fetch real data from backend
  useEffect(() => {
    fetchReviewData();
  }, [currentPage, filterLegit]);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch reviews with pagination and ML filtering
      const reviewResponse = await authAPI.getAllReviews(currentPage, 8, filterLegit, true, 0.7);
      setReviewList(reviewResponse.reviews || []);
      setTotalReviews(reviewResponse.total || 0);
      setTotalPages(reviewResponse.pages || Math.ceil((reviewResponse.total || 0) / 8));
      setMlEnabled(reviewResponse.ml_enabled || false);
      
      // Use statistics from backend (total counts, not page counts)
      if (reviewResponse.statistics && reviewResponse.statistics.rating_distribution) {
        setReviewStatistics(reviewResponse.statistics);
        const ratingStats = reviewResponse.statistics.rating_distribution;
        setReviewStats([
          { label: '5-Star Ratings', value: ratingStats[5] || 0, color: 'green' },
          { label: '4-Star Ratings', value: ratingStats[4] || 0, color: 'blue' },
          { label: '3-Star Ratings', value: ratingStats[3] || 0, color: 'yellow' },
          { label: '2-Star Ratings', value: ratingStats[2] || 0, color: 'orange' },
          { label: '1-Star Ratings', value: ratingStats[1] || 0, color: 'red' }
        ]);
      } else {
        // Fallback: calculate from page data if statistics not available
        calculateStats(reviewResponse.reviews || []);
      }
      
    } catch (err) {
      console.error('Error fetching review data:', err);
      setError(err.message || 'Failed to fetch review data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (reviewData) => {
    const stats = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };
    
    reviewData.forEach(review => {
      if (review.rating && review.rating >= 1 && review.rating <= 5) {
        stats[review.rating]++;
      }
    });
    
    setReviewStats([
      { label: '5-Star Ratings', value: stats[5], color: 'green' },
      { label: '4-Star Ratings', value: stats[4], color: 'blue' },
      { label: '3-Star Ratings', value: stats[3], color: 'yellow' },
      { label: '2-Star Ratings', value: stats[2], color: 'orange' },
      { label: '1-Star Ratings', value: stats[1], color: 'red' }
    ]);
  };

  // Filter reviews based on search query and filters
  const filteredReviews = reviewList.filter(item => {
    const matchesSearch = 
      item.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.review_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRating = ratingFilter === 'all' || item.rating === parseInt(ratingFilter);
    const matchesUser = userFilter === 'all' || item.user_type === userFilter;
    
    // Date filter (simplified - could be enhanced)
    const matchesDate = dateFilter === 'all' || true; // TODO: Implement date filtering
    
    return matchesSearch && matchesRating && matchesUser && matchesDate;
  });

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleVerifyToggle = async (reviewId, isCurrentlyVerified) => {
    try {
      if (isCurrentlyVerified) {
        await authAPI.unverifyFeedback(reviewId);
        setReviewList(prevList => 
          prevList.map(review => 
            review.id === reviewId 
              ? { ...review, is_verified: false }
              : review
          )
        );
      } else {
        await authAPI.verifyFeedback(reviewId);
        setReviewList(prevList => 
          prevList.map(review => 
            review.id === reviewId 
              ? { ...review, is_verified: true }
              : review
          )
        );
      }
      
      // Refresh data to get updated statistics
      fetchReviewData();
      
    } catch (error) {
      console.error('Failed to toggle verification:', error);
      setError('Failed to update review verification status');
    }
  };

  const handleRespond = (reviewId) => {
    // Navigate to the separate respond to review page (can reuse feedback respond page)
    window.location.href = `/dashboard/respond-to-feedback/${reviewId}?type=review`;
  };

  const handleView = (reviewId) => {
    // Navigate to view review page
    window.location.href = `/dashboard/view-feedback/${reviewId}?type=review`;
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'star-filled' : 'star-empty'}>
          ★
        </span>
      );
    }
    return <div className="review-management-stars-container">{stars}</div>;
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          <div className="user-content-header">
            <h1 className="user-main-title">Review Management</h1>
          </div>
          
          {loading ? (
            <div className="review-management-loading">Loading reviews...</div>
          ) : error ? (
            <div className="review-management-error">Error: {error}</div>
          ) : (
            <>
              {/* Review Summary Cards */}
              <section className="review-management-stats-section">
                <div className="review-management-stats-grid">
                  {reviewStats.map((stat, index) => (
                    <div key={index} className={`review-management-stat-card stat-${stat.color}`}>
                      <div className="review-management-stat-label">{stat.label}</div>
                      <div className="review-management-stat-value">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Search and Filter Section */}
              <section className="review-management-filters-section">
                <div className="review-management-search-container">
                  <input
                    type="text"
                    className="review-management-search-input"
                    placeholder="Search review"
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                  <span className="review-management-search-icon">🔍</span>
                </div>
                <div className="review-management-filters">
                  <select 
                    className="review-management-filter-select"
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                  >
                    <option value="all">Rating</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                  <select 
                    className="review-management-filter-select"
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                  >
                    <option value="all">User</option>
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                    <option value="agent">Agent</option>
                  </select>
                  <select 
                    className="review-management-filter-select"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    <option value="all">Date</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                  <label className={`review-management-ml-filter-toggle ${!mlEnabled ? 'disabled' : ''} ${filterLegit ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={filterLegit}
                      onChange={(e) => setFilterLegit(e.target.checked)}
                      disabled={!mlEnabled}
                      title={mlEnabled ? "Filter to show only legitimate (positive, high confidence) reviews" : "ML filtering is not available - install dependencies and restart server"}
                    />
                    <span>🤖 Show Only Legit Reviews {mlEnabled ? "(ML Active)" : "(ML Not Available)"}</span>
                  </label>
                </div>
                {filterLegit && mlEnabled && (
                  <div className="review-management-filter-status">
                    <span className="filter-status-badge">🔍 ML Filter Active</span>
                    <span className="filter-status-text">
                      Showing {totalReviews} legitimate review(s) (Positive sentiment, ≥70% confidence)
                    </span>
                  </div>
                )}
              </section>

              {/* Reviews Table */}
              <section className="review-management-table-section">
                <div className="review-management-table-container">
                  <table className="review-management-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Review</th>
                        <th>Date</th>
                        <th>Rating</th>
                        <th>Push to Homepage</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReviews.length > 0 ? (
                        filteredReviews.map((review) => (
                          <tr key={review.id} className="review-management-review-row">
                            <td className="review-management-user-name">
                              <div>
                                <div className="review-management-user-display-name">{review.user_name}</div>
                                <div className="review-management-user-email">({review.user_email})</div>
                              </div>
                            </td>
                            <td className="review-management-review-text">
                              <div>{review.review_text}</div>
                              {review.ml_sentiment && (
                                <div className="review-management-ml-info">
                                  <div className="ml-info-row">
                                    {review.ml_is_legit !== undefined && (
                                      <span className={`ml-legit-badge ${review.ml_is_legit ? 'legit' : 'not-legit'}`}>
                                        {review.ml_is_legit ? '✓ Legit' : '✗ Not Legit'}
                                      </span>
                                    )}
                                  </div>
                                  {review.ml_reason && (
                                    <div className="ml-reason">
                                      <small>{review.ml_reason}</small>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="review-management-review-date">
                              {review.review_date ? new Date(review.review_date).toLocaleDateString() : 'No date'}
                            </td>
                            <td className="review-management-rating">
                              {renderStars(review.rating)}
                            </td>
                            <td className="review-management-verify-toggle">
                              <button
                                className={`review-management-toggle-switch ${review.is_verified ? 'active' : ''}`}
                                onClick={() => handleVerifyToggle(review.id, review.is_verified)}
                                title={review.is_verified ? 'Currently on homepage - Click to remove' : 'Currently private - Click to push to homepage'}
                              >
                                <span className="review-management-toggle-slider"></span>
                              </button>
                            </td>
                            <td className="review-management-review-actions">
                              <div className="review-management-action-buttons">
                                {!review.admin_response ? (
                                  <button 
                                    className="review-management-action-btn review-management-respond-btn"
                                    onClick={() => handleRespond(review.id)}
                                    title="Send response to user"
                                  >
                                    Respond
                                  </button>
                                ) : (
                                  <button 
                                    className="review-management-action-btn review-management-view-btn"
                                    onClick={() => handleView(review.id)}
                                    title="View review and response"
                                  >
                                    View
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="review-management-no-data">
                            No reviews found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Pagination */}
              {totalPages > 1 && (
                <section className="review-management-pagination-section">
                  <div className="review-management-pagination">
                    <button
                      className="review-management-pagination-btn"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      ←
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        className={`review-management-pagination-btn ${currentPage === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      className="review-management-pagination-btn"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      →
                    </button>
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default ReviewManagement;

