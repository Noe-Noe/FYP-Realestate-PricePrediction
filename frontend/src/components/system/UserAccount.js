import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import Header from '../sharedpages/header.js';
import Navbar from '../sharedpages/navbar.js';
import Footer from '../sharedpages/footer.js';
import './UserAccount.css';

const UserAccount = () => {
  console.log('UserAccount component rendered');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('user-accounts');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // State for real user data
  const [userAccounts, setUserAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch user data from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await authAPI.getAllUsers(currentPage, 20);
        setUserAccounts(response.users || []);
        setTotalUsers(response.total || 0);
        setTotalPages(response.pages || 1);
        
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [currentPage]);

  // Filter users based on search query
  const filteredUsers = userAccounts.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.referral_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleUserClick = (userId) => {
    console.log('User clicked:', userId);
    navigate(`/dashboard/user-details/${userId}`);
  };

  const getSubscriptionBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'premium':
        return 'user-account-subscription-badge premium';
      case 'free':
        return 'user-account-subscription-badge free';
      case 'agent':
        return 'user-account-subscription-badge agent';
      case 'admin':
        return 'user-account-subscription-badge admin';
      default:
        return 'user-account-subscription-badge';
    }
  };

  const getAccountStatusBadgeClass = (status) => {
    if (status === 'Active') {
      return 'user-account-account-status-badge active';
    } else if (status === 'admin') {
      return 'user-account-account-status-badge admin';
    } else {
      return 'user-account-account-status-badge inactive';
    }
  };

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          <div className="user-content-header">
            <h1 className="user-main-title">User Accounts</h1>
            <p className="user-account-page-description">Manage user accounts and their subscription status.</p>
          </div>
          
          <div className="user-account-content">
            {/* Search Section */}
            <div className="user-account-search-section">
              <div className="user-account-search-container">
                <span className="user-account-search-icon">🔍</span>
                <input
                  type="text"
                  className="user-account-search-input"
                  placeholder="Search by name, email, or referral code"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="user-account-loading">
                <p>Loading users...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="user-account-error">
                <p>Error: {error}</p>
                <button onClick={() => window.location.reload()} className="user-account-retry-btn">
                  Retry
                </button>
              </div>
            )}

            {/* Users Table */}
            {!loading && !error && (
              <div className="user-account-table-container">
                <table className="user-account-users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Referral Code</th>
                      <th>User Type</th>
                      <th>Account Created Date</th>
                      <th>Account Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="user-account-user-row" onClick={() => handleUserClick(user.id)}>
                          <td className="user-account-user-name">{user.full_name}</td>
                          <td className="user-account-user-email">{user.email}</td>
                          <td className="user-account-referral-code">
                            {user.referral_code || (user.user_type === 'premium' ? 'Generating...' : 'N/A')}
                          </td>
                          <td className="subscription-status">
                            <span className={getSubscriptionBadgeClass(user.user_type)}>
                              {user.user_type}
                            </span>
                          </td>
                          <td className="user-account-account-created-date">
                            {user.account_created_date ? new Date(user.account_created_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="account-status">
                            <span className={getAccountStatusBadgeClass(user.subscription_status)}>
                              {user.subscription_status}
                            </span>
                          </td>
                          <td className="user-account-action-arrow">
                            <span className="user-account-arrow-icon">→</span>
                          </td>
                        </tr>
                      ))
                                         ) : (
                       <tr>
                         <td colSpan="7" className="user-account-no-data">
                           {searchQuery ? 'No users match your search' : 'No users found'}
                         </td>
                       </tr>
                     )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="user-account-pagination-container">
                <div className="user-account-pagination">
                  <button 
                    className="user-account-pagination-arrow"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                        className={`user-account-pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button 
                    className="user-account-pagination-arrow"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    →
                  </button>
                </div>
                <div className="user-account-pagination-info">
                  Showing page {currentPage} of {totalPages} ({totalUsers} total users)
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default UserAccount;
