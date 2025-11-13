import React, { useState, useEffect } from 'react';
import { useApi } from '../../context/ApiContext';
import { authAPI } from '../../services/api';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './SysAdmin.css';

const SysAdmin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { getUserName } = useApi();
  
  // State for real data
  const [metricsData, setMetricsData] = useState(null);
  const [userAccounts, setUserAccounts] = useState([]);
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real data from backend
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch metrics
        const metricsResponse = await authAPI.getAdminMetrics();
        setMetricsData(metricsResponse);
        
        // Fetch users
        const usersResponse = await authAPI.getAllUsers(1, 5); // First 5 users
        setUserAccounts(usersResponse.users || []);
        
        // Fetch feedback
        const feedbackResponse = await authAPI.getAllFeedback(1, 3); // First 3 feedback items
        setRecentFeedback(feedbackResponse.feedback || []);
        
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError(err.message || 'Failed to fetch admin data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminData();
  }, []);

  // Refresh data when window regains focus (user navigates back from feedback management)
  useEffect(() => {
    const handleFocus = () => {
      const fetchAdminData = async () => {
        try {
          // Fetch metrics
          const metricsResponse = await authAPI.getAdminMetrics();
          setMetricsData(metricsResponse);
          
          // Fetch feedback
          const feedbackResponse = await authAPI.getAllFeedback(1, 3);
          setRecentFeedback(feedbackResponse.feedback || []);
        } catch (err) {
          console.error('Error refreshing admin data:', err);
        }
      };
      fetchAdminData();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);








  const handleViewMoreAccounts = () => {
    window.location.href = '/dashboard/user-accounts';
  };

  const handleViewMoreFeedback = () => {
    window.location.href = '/dashboard/feedback-management';
  };





  const getStatusBadgeClass = (status) => {
    return status === 'Active' ? 'sys-admin-status-badge active' : 'sys-admin-status-badge inactive';
  };

  const getUserTypeBadgeClass = (userType) => {
    switch (userType) {
      case 'premium':
        return 'sys-admin-user-type-badge premium';
      case 'free':
        return 'sys-admin-user-type-badge free';
      case 'agent':
        return 'sys-admin-user-type-badge agent';
      case 'admin':
        return 'sys-admin-user-type-badge admin';
      default:
        return 'sys-admin-user-type-badge default';
    }
  };

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          <div className="user-content-header">
            <h1 className="user-main-title">System Admin's Dashboard</h1>
            <p className="user-welcome-message">Welcome back, {getUserName()}</p>
          </div>
          
          <div className="sys-admin-dashboard-content">
            {/* Key Metrics Section */}
            <section className="sys-admin-metrics-section">
              {loading ? (
                <div className="sys-admin-loading">Loading metrics...</div>
              ) : error ? (
                <div className="sys-admin-error">Error: {error}</div>
              ) : metricsData ? (
                <div className="sys-admin-metrics-grid">
                  <div className="sys-admin-metric-card">
                    <h3 className="sys-admin-metric-title">Total Users</h3>
                    <div className="sys-admin-metric-value">{metricsData.total_users || 0}</div>
                  </div>
                  <div className="sys-admin-metric-card">
                    <h3 className="sys-admin-metric-title">Active Subscriptions</h3>
                    <div className="sys-admin-metric-value">{metricsData.active_subscriptions || 0}</div>
                  </div>
                  <div className="sys-admin-metric-card">
                    <h3 className="sys-admin-metric-title">Total Feedback</h3>
                    <div className="sys-admin-metric-value">{metricsData.total_feedback || 0}</div>
                  </div>
                  <div className="sys-admin-metric-card">
                    <h3 className="sys-admin-metric-title">Monthly Revenue</h3>
                    <div className="sys-admin-metric-value">${metricsData.monthly_revenue || 0}</div>
                  </div>
                </div>
              ) : (
                <div className="sys-admin-no-data">No metrics data available</div>
              )}
            </section>

            {/* User Account List Section */}
            <section className="sys-admin-user-accounts-section">
              <div className="sys-admin-section-header">
                <h2 className="sys-admin-section-title">User Account List</h2>
                <button 
                  className="sys-admin-view-more-btn"
                  onClick={handleViewMoreAccounts}
                >
                  View More Accounts
                </button>
              </div>
              {loading ? (
                <div className="sys-admin-loading">Loading user accounts...</div>
              ) : error ? (
                <div className="sys-admin-error">Error: {error}</div>
              ) : userAccounts.length > 0 ? (
                <div className="sys-admin-table-container">
                  <table className="sys-admin-data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>User Type</th>
                        <th>Account Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userAccounts.map((user) => (
                        <tr key={user.id} className="sys-admin-user-row">
                          <td className="sys-admin-user-name">{user.full_name}</td>
                          <td className="sys-admin-user-email">{user.email}</td>
                          <td className="sys-admin-user-type">
                            <span className={getUserTypeBadgeClass(user.user_type)}>
                              {user.user_type}
                            </span>
                          </td>
                          <td className="sys-admin-user-status">
                            <span className={getStatusBadgeClass(user.subscription_status)}>
                              {user.subscription_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="sys-admin-no-data">No user accounts found</div>
              )}
            </section>

            {/* Recent User Feedback Section */}
            <section className="sys-admin-feedback-section">
              <div className="sys-admin-section-header">
                <h2 className="sys-admin-section-title">Recent User Feedback</h2>
                <button 
                  className="sys-admin-view-more-btn"
                  onClick={handleViewMoreFeedback}
                >
                  View More Feedback
                </button>
              </div>
              {loading ? (
                <div className="sys-admin-loading">Loading feedback...</div>
              ) : error ? (
                <div className="sys-admin-error">Error: {error}</div>
              ) : recentFeedback.length > 0 ? (
                <div className="sys-admin-feedback-list">
                  {recentFeedback.map((feedback) => {
                    // Get inquiry type label
                    const getInquiryTypeLabel = (type) => {
                      switch(type) {
                        case 'general':
                          return 'General Feedback';
                        case 'support':
                          return 'Support Request';
                        case 'property_viewing':
                          return 'Property Viewing Inquiry';
                        case 'price_quote':
                          return 'Price Quote Request';
                        default:
                          return type;
                      }
                    };

                    // Get status badge class - use admin_response to determine status
                    const getStatusClass = (hasAdminResponse) => {
                      return hasAdminResponse ? 'status-responded' : 'status-progress';
                    };

                    const getStatusText = (hasAdminResponse) => {
                      return hasAdminResponse ? 'Responded' : 'In Progress';
                    };

                    return (
                    <div key={feedback.id} className="sys-admin-feedback-item">
                      <div className="sys-admin-feedback-header">
                        <div className="sys-admin-feedback-user-info">
                          <span className="sys-admin-feedback-user-name">{feedback.user_name}</span>
                          <span className="sys-admin-feedback-user-email">({feedback.user_email})</span>
                        </div>
                        <div className="sys-admin-feedback-badges">
                            <span className="sys-admin-feedback-inquiry-type">
                              {getInquiryTypeLabel(feedback.inquiry_type)}
                          </span>
                            <span className={`sys-admin-feedback-status ${getStatusClass(!!feedback.admin_response)}`}>
                              {getStatusText(!!feedback.admin_response)}
                          </span>
                        </div>
                      </div>
                      <div className="sys-admin-feedback-content">
                          <p className="sys-admin-feedback-text">"{feedback.message}"</p>
                      </div>
                      <div className="sys-admin-feedback-actions">
                        <span className="sys-admin-feedback-date">
                            {feedback.created_at ? new Date(feedback.created_at).toLocaleDateString() : 'No date'}
                        </span>
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="sys-admin-no-data">No feedback available</div>
              )}
            </section>


          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default SysAdmin;
