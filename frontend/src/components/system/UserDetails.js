import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI, BACKEND_ORIGIN } from '../../services/api';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './UserDetails.css';

const UserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('user-accounts');
  const [user, setUser] = useState(null);
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
      
      // Refresh user data from server to get accurate status
      const userData = await authAPI.getUserById(userId);
      setUser(userData);
      
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
      
      // Refresh user data from server to get accurate status
      const userData = await authAPI.getUserById(userId);
      setUser(userData);
      
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
      
      // Refresh user data from server to get accurate status
      const userData = await authAPI.getUserById(userId);
      setUser(userData);
      
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
                {(() => {
                  // Normalize subscription_status to handle both lowercase and capitalized values
                  const status = (user.subscription_status || '').toLowerCase();
                  const isSuspended = status === 'cancelled' || status === 'suspended';
                  const isActive = user.is_active === true || user.is_active === 'true';
                  
                  // Show Deactivate/Suspend buttons if user is active and not suspended
                  if (isActive && !isSuspended) {
                    return (
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
                    );
                  } else {
                    // Show Reactivate button if user is deactivated or suspended
                    return (
                      <button 
                        className="user-details-action-btn user-details-reactivate-btn" 
                        onClick={handleReactivate}
                      >
                        Reactivate
                      </button>
                    );
                  }
                })()}
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

            {/* Agent Details Section - Only show if user is an agent */}
            {user.user_type === 'agent' && user.agent_profile && (
              <section className="user-details-agent-info-section">
                <h2 className="user-details-section-title">Agent Details</h2>
                
                {/* Debug: Log validation details */}
                {console.log('Validation details:', user.agent_profile.validation_details)}
                
                {/* Verification Status Warning */}
                {user.agent_profile.verification_status === 'unverified' && (
                  <div className="user-details-verification-warning" style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    color: '#dc2626'
                  }}>
                    <strong>⚠️ Verification Alert:</strong> This agent's information does not match the records. Please verify the agent's credentials.
                  </div>
                )}
                
                {user.agent_profile.verification_status === 'verified' && (
                  <div className="user-details-verification-success" style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    color: '#166534'
                  }}>
                    <strong>✓ Verified:</strong> Agent information matches records.
                    {user.agent_profile.verification_checked_at && (
                      <span style={{ display: 'block', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        Last verified: {new Date(user.agent_profile.verification_checked_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="user-details-info-grid">
                  <div className="user-details-info-item">
                    <label>Salesperson Name:</label>
                    <span>
                      {user.full_name || 'N/A'}
                      {user.agent_profile.validation_details && 
                       user.agent_profile.validation_details.salesperson_match === false && (
                        <span style={{ color: '#dc2626', marginLeft: '0.5rem', fontWeight: 'bold', fontSize: '1.2rem' }} title="This field does not match CSV records">!</span>
                      )}
                    </span>
                  </div>
                  <div className="user-details-info-item">
                    <label>License Number (CEA):</label>
                    <span>
                      {user.agent_profile.license_number || 'N/A'}
                      {user.agent_profile.validation_details && 
                       (user.agent_profile.validation_details.license_match === false || 
                        user.agent_profile.validation_details.license_match === undefined) && (
                        <span style={{ color: '#dc2626', marginLeft: '0.5rem', fontWeight: 'bold', fontSize: '1.2rem' }} title="This field does not match CSV records">!</span>
                      )}
                    </span>
                  </div>
                  <div className="user-details-info-item">
                    <label>Company Name:</label>
                    <span>
                      {user.agent_profile.company_name || 'N/A'}
                      {user.agent_profile.validation_details && 
                       user.agent_profile.validation_details.company_match === false && (
                        <span style={{ color: '#dc2626', marginLeft: '0.5rem', fontWeight: 'bold', fontSize: '1.2rem' }} title="This field does not match CSV records">!</span>
                      )}
                    </span>
                  </div>
                  <div className="user-details-info-item">
                    <label>Registration Start Date:</label>
                    <span>
                      {user.agent_profile.registration_start_date 
                        ? new Date(user.agent_profile.registration_start_date).toLocaleDateString() 
                        : 'N/A'}
                      {user.agent_profile.validation_details && 
                       user.agent_profile.validation_details.registration_date_match === false && (
                        <span style={{ color: '#dc2626', marginLeft: '0.5rem', fontWeight: 'bold', fontSize: '1.2rem' }} title="This field does not match CSV records">!</span>
                      )}
                    </span>
                  </div>
                  <div className="user-details-info-item">
                    <label>Verification Status:</label>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      backgroundColor: user.agent_profile.verification_status === 'verified' ? '#d1fae5' : 
                                     user.agent_profile.verification_status === 'unverified' ? '#fee2e2' : '#f3f4f6',
                      color: user.agent_profile.verification_status === 'verified' ? '#065f46' : 
                            user.agent_profile.verification_status === 'unverified' ? '#991b1b' : '#374151'
                    }}>
                      {user.agent_profile.verification_status === 'verified' ? '✓ Verified' : 
                       user.agent_profile.verification_status === 'unverified' ? '⚠ Unverified' : '⏳ Pending'}
                    </span>
                  </div>
                  {user.agent_profile.company_phone && (
                    <div className="user-details-info-item">
                      <label>Company Phone:</label>
                      <span>{user.agent_profile.company_phone}</span>
                    </div>
                  )}
                  {user.agent_profile.company_email && (
                    <div className="user-details-info-item">
                      <label>Company Email:</label>
                      <span>{user.agent_profile.company_email}</span>
                    </div>
                  )}
                  {user.agent_profile.specializations && Array.isArray(user.agent_profile.specializations) && user.agent_profile.specializations.length > 0 && (
                    <div className="user-details-info-item">
                      <label>Specializations:</label>
                      <span>{user.agent_profile.specializations.join(', ')}</span>
                    </div>
                  )}
                  {user.agent_profile.license_picture_url && (
                    <div className="user-details-info-item user-details-info-item-full">
                      <label>License Document:</label>
                      <div className="user-details-license-picture">
                        {(() => {
                          const licenseUrl = `${BACKEND_ORIGIN || ''}${user.agent_profile.license_picture_url}`;
                          const isImage = /\.(jpg|jpeg|png|gif)$/i.test(user.agent_profile.license_picture_url);
                          const isPdf = /\.pdf$/i.test(user.agent_profile.license_picture_url);
                          
                          if (isImage) {
                            return (
                              <div className="user-details-license-preview">
                                <img 
                                  src={licenseUrl} 
                                  alt="License Document" 
                                  className="user-details-license-image"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'block';
                                  }}
                                />
                                <a 
                                  href={licenseUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="user-details-license-link"
                                  style={{ display: 'none' }}
                                >
                                  View License Document
                                </a>
                              </div>
                            );
                          } else {
                            return (
                              <a 
                                href={licenseUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="user-details-license-link"
                              >
                                {isPdf ? 'View PDF License Document' : 'View License Document'}
                              </a>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

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
