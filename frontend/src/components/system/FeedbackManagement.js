import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './FeedbackManagement.css';

const FeedbackManagement = () => {
  const [activeTab, setActiveTab] = useState('feedback');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [filterLegit, setFilterLegit] = useState(false); // ML filter toggle
  
  // State for real data
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFeedback, setTotalFeedback] = useState(0);
  const [mlEnabled, setMlEnabled] = useState(false);
  const [feedbackStatistics, setFeedbackStatistics] = useState({
    total_responded: 0,
    total_not_responded: 0
  });
  




  // Fetch real data from backend
  useEffect(() => {
    fetchFeedbackData();
  }, [currentPage, filterLegit]);

  // Refresh data when window regains focus (user navigates back)
  useEffect(() => {
    const handleFocus = () => {
      fetchFeedbackData();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentPage]);

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch feedback with pagination and ML filtering
      const feedbackResponse = await authAPI.getAllFeedback(currentPage, 8, filterLegit, true, 0.7);
      setFeedbackList(feedbackResponse.feedback || []);
      setTotalFeedback(feedbackResponse.total || 0);
      setTotalPages(feedbackResponse.pages || Math.ceil((feedbackResponse.total || 0) / 8));
      setMlEnabled(feedbackResponse.ml_enabled || false);
      
      // Use statistics from backend (total counts, not page counts)
      if (feedbackResponse.statistics) {
        setFeedbackStatistics(feedbackResponse.statistics);
        setFeedbackStats([
          { label: 'Total Feedbacks', value: feedbackResponse.total || 0, color: 'blue' },
          { label: 'Responded Feedback', value: feedbackResponse.statistics.total_responded || 0, color: 'green' },
          { label: 'Not Responded Feedback', value: feedbackResponse.statistics.total_not_responded || 0, color: 'red' }
        ]);
      } else {
        // Fallback: calculate from page data if statistics not available
        calculateStats(feedbackResponse.feedback || []);
      }
      
    } catch (err) {
      console.error('Error fetching feedback data:', err);
      setError(err.message || 'Failed to fetch feedback data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (feedbackData) => {
    if (!feedbackData.length) {
      setFeedbackStats([
        { label: 'Total Feedbacks', value: 0, color: 'blue' },
        { label: 'Responded Feedback', value: 0, color: 'green' },
        { label: 'Not Responded Feedback', value: 0, color: 'red' }
      ]);
      return;
    }

    // Count by response status
    const stats = {
      total: feedbackData.length,
      responded: 0,
      not_responded: 0
    };

    feedbackData.forEach(feedback => {
      if (feedback.admin_response) {
        stats.responded++;
      } else {
        stats.not_responded++;
      }
    });

    setFeedbackStats([
      { label: 'Total Feedbacks', value: stats.total, color: 'blue' },
      { label: 'Responded Feedback', value: stats.responded, color: 'green' },
      { label: 'Not Responded Feedback', value: stats.not_responded, color: 'red' }
    ]);
  };

  // Filter feedback based on search query and filters
  const filteredFeedback = feedbackList.filter(item => {
    // Search filter
    const matchesSearch = 
    item.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.message || item.review_text)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Type filter
    const matchesType = typeFilter === 'all' || item.inquiry_type === typeFilter;
    
    // User type filter
    const matchesUser = userFilter === 'all' || item.user_type === userFilter;
    
    // Date filter
    let matchesDate = true;
    if (dateFilter !== 'all' && item.created_at) {
      const feedbackDate = new Date(item.created_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dateFilter === 'today') {
        const feedbackDateStart = new Date(feedbackDate);
        feedbackDateStart.setHours(0, 0, 0, 0);
        matchesDate = feedbackDateStart.getTime() === today.getTime();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDate = feedbackDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchesDate = feedbackDate >= monthAgo;
      }
    }
    
    return matchesSearch && matchesType && matchesUser && matchesDate;
  });

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleVerify = async (feedbackId) => {
    try {
      // Simply verify the feedback (make it public)
      await authAPI.verifyFeedback(feedbackId);
      
      // Update local state
      setFeedbackList(prevList => 
        prevList.map(feedback => 
          feedback.id === feedbackId 
            ? { ...feedback, is_verified: true }
            : feedback
        )
      );
      
      // Refresh data to get updated statistics
      fetchFeedbackData();
      
    } catch (error) {
      console.error('Failed to verify feedback:', error);
      setError('Failed to verify feedback');
    }
  };

  const handleRespond = (feedbackId) => {
    // Navigate to the separate respond to feedback page with type=feedback
    window.location.href = `/dashboard/respond-to-feedback/${feedbackId}?type=feedback`;
  };

  const handleVerifyToggle = async (feedbackId, isCurrentlyVerified) => {
    try {
      if (isCurrentlyVerified) {
        // If already verified, unverify it (remove from homepage)
        await authAPI.unverifyFeedback(feedbackId);
        setFeedbackList(prevList => 
          prevList.map(feedback => 
            feedback.id === feedbackId 
              ? { ...feedback, is_verified: false }
              : feedback
          )
        );
      } else {
        // If not verified, verify it (push to homepage)
        await authAPI.verifyFeedback(feedbackId);
        setFeedbackList(prevList => 
          prevList.map(feedback => 
            feedback.id === feedbackId 
              ? { ...feedback, is_verified: true }
              : feedback
          )
        );
      }
      
      // Refresh data to get updated statistics
      fetchFeedbackData();
      
    } catch (error) {
      console.error('Failed to toggle verification:', error);
      setError('Failed to update verification status');
    }
  };





  const handleView = (feedbackId) => {
    console.log('View feedback:', feedbackId);
    // Navigate to view feedback page with ID and type=feedback
    window.location.href = `/dashboard/view-feedback/${feedbackId}?type=feedback`;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getStatusBadgeClass = (hasAdminResponse) => {
    return hasAdminResponse 
      ? 'feedback-management-status-badge responded'
      : 'feedback-management-status-badge pending';
  };

  const getStatusText = (hasAdminResponse) => {
    return hasAdminResponse ? 'Responded' : 'In Progress';
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`feedback-management-star ${i <= rating ? 'filled' : 'empty'}`}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          <div className="user-content-header">
            <h1 className="user-main-title">Feedback Management</h1>
          </div>
          
          <div className="feedback-management-content">
            {loading && (
              <div className="feedback-management-loading">Loading feedback data...</div>
            )}
            
            {error && (
              <div className="feedback-management-error">
                Error: {error}
                <button onClick={fetchFeedbackData} className="feedback-management-retry-btn">
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && (
              <>
                {/* Feedback Statistics Section */}
                <section className="feedback-management-feedback-stats-section">
                  <div className="feedback-management-stats-grid">
                    {feedbackStats.map((stat, index) => (
                      <div key={index} className={`feedback-management-stat-card ${stat.color}`}>
                        <div className="feedback-management-stat-value">{stat.value}</div>
                        <div className="feedback-management-stat-label">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Search and Filter Section */}
            <section className="feedback-management-filters-section">
              <div className="feedback-management-search-container">
                <input
                  type="text"
                  className="feedback-management-search-input"
                  placeholder="Search feedback"
                  value={searchQuery}
                  onChange={handleSearch}
                />
                <span className="feedback-management-search-icon">🔍</span>
              </div>
              <div className="feedback-management-filters">
                <select 
                  className="feedback-management-filter-select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">Feedback Type</option>
                  <option value="general">General Feedback</option>
                  <option value="support">Support Request</option>
                  <option value="property_viewing">Property Viewing</option>
                  <option value="price_quote">Price Quote</option>
                </select>
                <select 
                  className="feedback-management-filter-select"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                >
                  <option value="all">User Type</option>
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="agent">Agent</option>
                  <option value="guest">Guest</option>
                </select>
                <select 
                  className="feedback-management-filter-select"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">Date Submitted</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                <label className={`feedback-management-ml-filter-toggle ${!mlEnabled ? 'disabled' : ''} ${filterLegit ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={filterLegit}
                    onChange={(e) => setFilterLegit(e.target.checked)}
                    disabled={!mlEnabled}
                    title={mlEnabled ? "Filter to show only legitimate (positive, high confidence) feedback" : "ML filtering is not available - install dependencies and restart server"}
                  />
                  <span>🤖 Show Only Legit Feedback {mlEnabled ? "(ML Active)" : "(ML Not Available)"}</span>
                </label>
              </div>
              {filterLegit && mlEnabled && (
                <div className="feedback-management-filter-status">
                  <span className="filter-status-badge">🔍 ML Filter Active</span>
                  <span className="filter-status-text">
                    Showing {totalFeedback} legitimate feedback(s) (Positive sentiment, ≥70% confidence)
                  </span>
                </div>
              )}
            </section>

            {/* Feedback List Section */}
            <section className="feedback-management-feedback-list-section">
              <div className="feedback-management-table-container">
                <table className="feedback-management-feedback-table">
                                     <thead>
                     <tr>
                       <th>User</th>
                       <th>Feedback</th>
                       <th>Date</th>
                       <th>Status</th>
                       <th>Type</th>
                       <th>Actions</th>
                     </tr>
                   </thead>
                  <tbody>
                    {filteredFeedback.length > 0 ? (
                      filteredFeedback.map((item) => (
                        <tr key={item.id} className="feedback-management-feedback-row">
                          <td className="feedback-management-user-name">
                            <div>
                              <div className="feedback-management-user-display-name">{item.user_name}</div>
                              <div className="feedback-management-user-email">({item.user_email})</div>
                            </div>
                          </td>
                          <td className="feedback-management-feedback-text">
                            <div>{item.message || item.review_text}</div>
                            {item.ml_sentiment && (
                              <div className="feedback-management-ml-info">
                                <div className="ml-info-row">
                                  {item.ml_is_legit !== undefined && (
                                    <span className={`ml-legit-badge ${item.ml_is_legit ? 'legit' : 'not-legit'}`}>
                                      {item.ml_is_legit ? '✓ Legit' : '✗ Not Legit'}
                                    </span>
                                  )}
                                </div>
                                {item.ml_reason && (
                                  <div className="ml-reason">
                                    <small>{item.ml_reason}</small>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="feedback-management-feedback-date">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : (item.review_date ? new Date(item.review_date).toLocaleDateString() : 'No date')}
                          </td>
                          <td className="feedback-status">
                            <span className={getStatusBadgeClass(!!item.admin_response)}>
                              {getStatusText(!!item.admin_response)}
                            </span>
                          </td>
                          <td className="feedback-inquiry-type">
                            {item.inquiry_type ? (() => {
                              switch(item.inquiry_type) {
                                case 'general': return 'General Feedback';
                                case 'support': return 'Support Request';
                                case 'property_viewing': return 'Property Viewing';
                                case 'price_quote': return 'Price Quote';
                                default: return item.inquiry_type;
                              }
                            })() : 'N/A'}
                           </td>
                                                                                 <td className="feedback-management-feedback-actions">
                                                             <div className="feedback-management-action-buttons">
                                 {!item.admin_response || (typeof item.admin_response === 'string' && item.admin_response.trim() === '') ? (
                                   <button 
                                     className="feedback-management-action-btn feedback-management-respond-btn"
                                     onClick={() => handleRespond(item.id)}
                                     title="Send response to user"
                                   >
                                     Respond
                                   </button>
                                 ) : (
                                   <button 
                                     className="feedback-management-action-btn feedback-management-view-btn"
                                     onClick={() => handleView(item.id)}
                                     title="View feedback details"
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
                        <td colSpan="6" className="feedback-management-no-data">
                          {searchQuery ? 'No feedback matches your search' : 'No feedback available'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="feedback-management-pagination-container">
                  <div className="feedback-management-pagination">
                    <button 
                      className="feedback-management-pagination-arrow"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      ←
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button 
                          key={pageNum}
                          className={`feedback-management-pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button 
                      className="feedback-management-pagination-arrow"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      →
                    </button>
                  </div>
                  <div className="feedback-management-pagination-info">
                    Showing page {currentPage} of {totalPages} ({totalFeedback} total feedback)
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
      

      
      <Footer />
    </div>
  );
};

export default FeedbackManagement;
