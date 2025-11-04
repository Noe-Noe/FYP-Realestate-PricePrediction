import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './UserDetails.css';

const UserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('user-accounts');
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState('');
  const [editingUserType, setEditingUserType] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState('');
  const [savingUserType, setSavingUserType] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data for user details
  const mockUsers = {
    1: {
      id: 1,
      name: 'Ethan Harper',
      email: 'ethan.harper@example.com',
      subscriptionStatus: 'Premium',
      accountCreatedDate: '2023-01-15',
      accountStatus: 'Active',
      phone: '(555) 123-4567',
      address: '123 Elm Street, Anytown, USA',
      activities: [
        { date: '2023-01-15', type: 'Account Created', details: 'User registered on the platform' },
        { date: '2023-02-20', type: 'Subscription Updated', details: 'Upgraded to Premium subscription' },
        { date: '2023-03-10', type: 'Property Viewed', details: 'Viewed property listing at 123 Main St' },
        { date: '2023-04-05', type: 'Search Query', details: 'Searched for office spaces in downtown' },
        { date: '2023-05-12', type: 'Contacted Agent', details: 'Sent a message to agent about a property' }
      ]
    },
    2: {
      id: 2,
      name: 'Olivia Bennett',
      email: 'olivia.bennett@example.com',
      subscriptionStatus: 'Free',
      accountCreatedDate: '2023-02-20',
      accountStatus: 'Active',
      phone: '(555) 234-5678',
      address: '456 Oak Avenue, Somewhere, USA',
      activities: [
        { date: '2023-02-20', type: 'Account Created', details: 'User registered on the platform' },
        { date: '2023-03-15', type: 'Property Viewed', details: 'Viewed property listing at 456 Oak Ave' },
        { date: '2023-04-10', type: 'Search Query', details: 'Searched for residential properties' }
      ]
    },
    3: {
      id: 3,
      name: 'Liam Carter',
      email: 'liam.carter@example.com',
      subscriptionStatus: 'Agent',
      accountCreatedDate: '2023-03-10',
      accountStatus: 'Active',
      phone: '(555) 345-6789',
      address: '789 Pine Road, Elsewhere, USA',
      activities: [
        { date: '2023-03-10', type: 'Account Created', details: 'Agent account registered on the platform' },
        { date: '2023-04-05', type: 'Property Listed', details: 'Listed new property at 789 Pine Road' },
        { date: '2023-05-20', type: 'Client Contact', details: 'Contacted by potential buyer' }
      ]
    }
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const userData = await authAPI.getUserById(userId);
        setUser(userData);
        setSelectedUserType(userData.user_type || 'free');
        
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError(err.message || 'Failed to fetch user details');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const handleBackToUserAccounts = () => {
    navigate('/dashboard/user-accounts');
  };

  const handleDeactivate = async () => {
    if (!window.confirm(`Are you sure you want to deactivate ${user.full_name}? This will prevent them from logging in.`)) {
      return;
    }

    try {
      await authAPI.deactivateUser(user.id);
      
      // Update local user state
      setUser(prevUser => ({
        ...prevUser,
        is_active: false,
        subscription_status: 'Inactive'
      }));
      
      // Show success message
      alert('User deactivated successfully');
      
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert(`Failed to deactivate user: ${error.message}`);
    }
  };

  const handleSuspend = async () => {
    if (!window.confirm(`Are you sure you want to suspend ${user.full_name}? This will restrict their account access.`)) {
      return;
    }

    try {
      await authAPI.suspendUser(user.id);
      
      // Update local user state
      setUser(prevUser => ({
        ...prevUser,
        subscription_status: 'Suspended'
      }));
      
      // Show success message
      alert('User suspended successfully');
      
    } catch (error) {
      console.error('Error suspending user:', error);
      alert(`Failed to suspend user: ${error.message}`);
    }
  };

  const handleReactivate = async () => {
    if (!window.confirm(`Are you sure you want to reactivate ${user.full_name}? This will restore their account access.`)) {
      return;
    }

    try {
      await authAPI.reactivateUser(user.id);
      
      // Update local user state
      setUser(prevUser => ({
        ...prevUser,
        is_active: true,
        subscription_status: 'Active'
      }));
      
      // Show success message
      alert('User reactivated successfully');
      
    } catch (error) {
      console.error('Error reactivating user:', error);
      alert(`Failed to reactivate user: ${error.message}`);
    }
  };

  const handleEditUserType = () => {
    setEditingUserType(true);
    setSelectedUserType(user.user_type || 'free');
  };

  const handleCancelEditUserType = () => {
    setEditingUserType(false);
    setSelectedUserType(user.user_type || 'free');
  };

  const handleSaveUserType = async () => {
    if (selectedUserType === user.user_type) {
      setEditingUserType(false);
      return;
    }

    if (!window.confirm(`Are you sure you want to change ${user.full_name}'s user type from ${user.user_type} to ${selectedUserType}?`)) {
      return;
    }

    try {
      setSavingUserType(true);
      
      const response = await authAPI.updateUser(user.id, {
        user_type: selectedUserType
      });
      
      // Update local user state
      setUser(prevUser => ({
        ...prevUser,
        user_type: selectedUserType
      }));
      
      setEditingUserType(false);
      alert('User type updated successfully');
      
    } catch (error) {
      console.error('Error updating user type:', error);
      alert(`Failed to update user type: ${error.message || 'Unknown error'}`);
    } finally {
      setSavingUserType(false);
    }
  };

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  const getSubscriptionBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'premium':
        return 'user-details-subscription-badge premium';
      case 'free':
        return 'user-details-subscription-badge free';
      case 'agent':
        return 'user-details-subscription-badge agent';
      case 'admin':
        return 'user-details-subscription-badge admin';
      default:
        return 'user-details-subscription-badge';
    }
  };

  const getAccountStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active':
        return 'user-details-account-status-badge active';
      case 'Inactive':
        return 'user-details-account-status-badge inactive';
      case 'Suspended':
        return 'user-details-account-status-badge suspended';
      case 'admin':
        return 'user-details-account-status-badge admin';
      default:
        return 'user-details-account-status-badge inactive';
    }
  };

  if (loading) {
    return (
      <div className="user-dashboard">
        <Header />
        <div className="user-dashboard-container">
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="user-main-content">
            <div className="user-content-header">
              <h1 className="user-main-title">Loading User Details...</h1>
            </div>
            <div className="user-details-loading">
              <p>Loading user information...</p>
            </div>
          </main>
        </div>
        <Footer />
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
            <div className="user-content-header">
              <h1 className="user-main-title">Error Loading User</h1>
            </div>
            <div className="user-details-error">
              <p>Error: {error}</p>
              <button onClick={() => window.location.reload()} className="user-details-retry-btn">
                Retry
              </button>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-dashboard">
        <Header />
        <div className="user-dashboard-container">
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="user-main-content">
            <div className="user-content-header">
              <h1 className="user-main-title">User Not Found</h1>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          <div className="user-content-header">
            <div className="user-details-breadcrumb">
              <span className="user-details-breadcrumb-item">User Accounts</span>
              <span className="user-details-breadcrumb-separator">/</span>
              <span className="user-details-breadcrumb-item">User Details</span>
            </div>
            <h1 className="user-main-title">User Details</h1>
            <p className="user-details-page-description">Comprehensive information about a specific user.</p>
          </div>
          
          <div className="user-details-content">
            {/* Account Information Section */}
            <section className="user-details-account-info-section">
              <h2 className="user-details-section-title">Account Information</h2>
              <div className="user-details-info-grid">
                <div className="user-details-info-item">
                  <label>Name:</label>
                  <span>{user.full_name}</span>
                </div>
                <div className="user-details-info-item">
                  <label>Email:</label>
                  <span>{user.email}</span>
                </div>
                <div className="user-details-info-item">
                  <label>User Type:</label>
                  {editingUserType ? (
                    <div className="user-details-user-type-edit">
                      <select
                        className="user-details-user-type-select"
                        value={selectedUserType}
                        onChange={(e) => setSelectedUserType(e.target.value)}
                        disabled={savingUserType}
                      >
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                        <option value="agent">Agent</option>
                        <option value="admin">Admin</option>
                      </select>
                      <div className="user-details-user-type-actions">
                        <button
                          className="user-details-user-type-save-btn"
                          onClick={handleSaveUserType}
                          disabled={savingUserType}
                        >
                          {savingUserType ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          className="user-details-user-type-cancel-btn"
                          onClick={handleCancelEditUserType}
                          disabled={savingUserType}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="user-details-user-type-display">
                  <span className={getSubscriptionBadgeClass(user.user_type)}>
                    {user.user_type}
                  </span>
                      <button
                        className="user-details-edit-user-type-btn"
                        onClick={handleEditUserType}
                        title="Change user type"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  )}
                </div>
                <div className="user-details-info-item">
                  <label>Account Created Date:</label>
                  <span>{user.account_created_date ? new Date(user.account_created_date).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="user-details-info-item">
                  <label>Account Status:</label>
                  <span className={getAccountStatusBadgeClass(user.subscription_status)}>
                    {user.subscription_status}
                  </span>
                </div>
              </div>
              <div className="user-details-action-buttons">
                {user.is_active && user.subscription_status !== 'Suspended' ? (
                  <>
                    <button 
                      className="user-details-action-btn user-details-deactivate-btn" 
                      onClick={handleDeactivate}
                      disabled={user.user_type === 'admin'}
                      title={user.user_type === 'admin' ? 'Admin accounts cannot be deactivated' : ''}
                    >
                      Deactivate
                    </button>
                    <button 
                      className="user-details-action-btn user-details-suspend-btn" 
                      onClick={handleSuspend}
                      disabled={user.user_type === 'admin'}
                      title={user.user_type === 'admin' ? 'Admin accounts cannot be suspended' : ''}
                    >
                      Suspend
                    </button>
                  </>
                ) : user.subscription_status === 'Suspended' ? (
                  <button 
                    className="user-details-action-btn user-details-reactivate-btn" 
                    onClick={handleReactivate}
                  >
                    Reactivate
                  </button>
                ) : (
                  <button 
                    className="user-details-action-btn user-details-reactivate-btn" 
                    onClick={handleReactivate}
                  >
                    Reactivate
                  </button>
                )}
              </div>
            </section>

            {/* Activity History Section */}
            <section className="user-details-activity-history-section">
              <h2 className="user-details-section-title">Activity History</h2>
              {user.activities && user.activities.length > 0 ? (
                <div className="user-details-table-container">
                  <table className="user-details-activity-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Activity Type</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.activities.map((activity, index) => (
                        <tr key={index}>
                          <td className="user-details-activity-date">
                            {activity.date ? new Date(activity.date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="user-details-activity-type">{activity.type}</td>
                          <td className="user-details-activity-details">{activity.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="user-details-no-activities">
                  <p>No recent activities found for this user.</p>
                </div>
              )}
            </section>

            {/* Contact Information Section */}
            <section className="user-details-contact-info-section">
              <h2 className="user-details-section-title">Contact Information</h2>
              <div className="user-details-contact-grid">
                <div className="user-details-contact-item">
                  <label>Phone Number:</label>
                  <span>{user.phone_number || 'N/A'}</span>
                </div>
                <div className="user-details-contact-item">
                  <label>Last Login:</label>
                  <span>{user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</span>
                </div>
              </div>
            </section>

            {/* Notes & Comments Section */}
            <section className="user-details-notes-section">
              <h2 className="user-details-section-title">Notes & Comments</h2>
              <textarea
                className="user-details-notes-textarea"
                placeholder="Add internal notes about this user..."
                value={notes}
                onChange={handleNotesChange}
                rows={6}
              />
            </section>

            {/* Back Button */}
            <div className="user-details-back-button-container">
              <button className="user-details-back-btn" onClick={handleBackToUserAccounts}>
                Back to User Accounts
              </button>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default UserDetails;
