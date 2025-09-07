import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './FeedbackManagement.css';

const FeedbackManagement = () => {
  const [activeTab, setActiveTab] = useState('feedback');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for real data
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFeedback, setTotalFeedback] = useState(0);
  




  // Fetch real data from backend
  useEffect(() => {
    fetchFeedbackData();
  }, [currentPage]);

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch feedback with pagination
      const feedbackResponse = await authAPI.getAllFeedback(currentPage, 10);
      setFeedbackList(feedbackResponse.feedback || []);
      setTotalFeedback(feedbackResponse.total || 0);
      setTotalPages(Math.ceil((feedbackResponse.total || 0) / 10));
      
      // Calculate statistics from the data
      calculateStats(feedbackResponse.feedback || []);
      
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
        { label: '5-Star Ratings', value: 0, color: 'green' },
        { label: '4-Star Ratings', value: 0, color: 'blue' },
        { label: '3-Star Ratings', value: 0, color: 'yellow' },
        { label: '2-Star Ratings', value: 0, color: 'orange' },
        { label: '1-Star Ratings', value: 0, color: 'red' },
        { label: 'Total Feedbacks', value: 0, color: 'purple' },
        { label: 'Responded Feedbacks', value: 0, color: 'green' },
        { label: 'Pending Feedbacks', value: 0, color: 'red' }
      ]);
      return;
    }

    // Count ratings
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let respondedCount = 0;
    let pendingCount = 0;

    feedbackData.forEach(feedback => {
      if (feedback.rating >= 1 && feedback.rating <= 5) {
        ratingCounts[feedback.rating]++;
      }
      if (feedback.admin_response) {
        respondedCount++;
      } else {
        pendingCount++;
      }
    });

    // Calculate total from the actual data, not from pagination
    const totalFromData = feedbackData.length;

    setFeedbackStats([
      { label: '5-Star Ratings', value: ratingCounts[5], color: 'green' },
      { label: '4-Star Ratings', value: ratingCounts[4], color: 'blue' },
      { label: '3-Star Ratings', value: ratingCounts[3], color: 'yellow' },
      { label: '2-Star Ratings', value: ratingCounts[2], color: 'orange' },
      { label: '1-Star Ratings', value: ratingCounts[1], color: 'red' },
      { label: 'Total Feedbacks', value: totalFromData, color: 'purple' },
              { label: 'Responded Feedbacks', value: respondedCount, color: 'green' },
        { label: 'Pending Feedbacks', value: pendingCount, color: 'red' }
    ]);
  };

  // Filter feedback based on search query
  const filteredFeedback = feedbackList.filter(item =>
    item.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.review_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    // Navigate to the separate respond to feedback page
    window.location.href = `/dashboard/respond-to-feedback/${feedbackId}`;
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
    // Navigate to view feedback page with ID
    window.location.href = `/dashboard/view-feedback/${feedbackId}`;
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
    return hasAdminResponse ? 'Responded' : 'Pending';
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

            {/* Search Section */}
            <section className="feedback-management-search-section">
              <div className="feedback-management-search-container">
                <span className="feedback-management-search-icon">🔍</span>
                <input
                  type="text"
                  className="feedback-management-search-input"
                  placeholder="Search feedback"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
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
                       <th>Response Status</th>
                       <th>Rating</th>
                       <th>Push to Homepage</th>
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
                          <td className="feedback-management-feedback-text">{item.review_text}</td>
                          <td className="feedback-management-feedback-date">
                            {item.review_date ? new Date(item.review_date).toLocaleDateString() : 'No date'}
                          </td>
                          <td className="feedback-status">
                            <span className={getStatusBadgeClass(!!item.admin_response)}>
                              {getStatusText(!!item.admin_response)}
                            </span>
                          </td>
                          <td className="feedback-rating">
                            <div className="feedback-management-stars-container">
                              {renderStars(item.rating)}
                            </div>
                          </td>
                                                     <td className="feedback-management-verify-toggle">
                             <button
                               className={`feedback-management-toggle-switch ${item.is_verified ? 'active' : ''}`}
                               onClick={() => handleVerifyToggle(item.id, item.is_verified)}
                               title={item.is_verified ? 'Currently on homepage - Click to remove' : 'Currently private - Click to push to homepage'}
                             >
                               <span className="feedback-management-toggle-slider"></span>
                             </button>
                           </td>
                                                                                 <td className="feedback-management-feedback-actions">
                                                             <div className="feedback-management-action-buttons">
                                 {!item.admin_response ? (
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
                        <td colSpan="7" className="feedback-management-no-data">
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
