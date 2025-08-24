import React, { useState } from 'react';
import { useApi } from '../../context/ApiContext';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './agent-common.css';
import './AgentUser.css';

const AgentUser = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { getUserName } = useApi();
  // Get user name from localStorage
  const userName = getUserName();

  // Mock data for listings
  const listings = [
    {
      id: 1,
      address: '201 Industrial Ave',
      type: 'Warehouse',
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop'
    },
    {
      id: 3,
      address: '101 Tech Drive',
      type: 'Factory',
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&h=200&fit=crop'
    }
  ];

  // Mock data for recent activity
  const recentActivity = [
    {
      id: 2,
      type: 'status',
      title: 'Listing Status Updated: 456 Maple Avenue - Sold',
      details: 'Sold on: 2024-03-15',
      time: '1 day ago'
    },
    {
      id: 4,
      type: 'status',
      title: 'Listing Status Updated: 101 Elm Street - Rented',
      details: 'Rented on: 2024-03-10',
      time: '3 days ago'
    }
  ];

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          <div className="user-content-header">
            <h1 className="user-main-title">Agent's Dashboard</h1>
            <p className="user-welcome-message">Welcome back, {userName}</p>
          </div>
          
          <div className="agent-user-dashboard-content">
            {/* Overview Section */}
            <section className="agent-user-overview-section">
              <h2 className="agent-user-section-title">Overview</h2>
              <div className="agent-user-stats-grid">
                <div className="agent-user-stat-card">
                  <h3>Active Listings</h3>
                  <p className="agent-user-stat-number">5</p>
                  <p className="agent-user-stat-label">Currently active</p>
                </div>
                
                <div className="agent-user-stat-card">
                  <h3>Listing Views</h3>
                  <p className="agent-user-stat-number">4,500</p>
                  <p className="agent-user-stat-label">Last 30 days</p>
                </div>
                
                <div className="agent-user-stat-card">
                  <h3>Assigned Regions</h3>
                  <p className="agent-user-stat-number">3</p>
                  <p className="agent-user-stat-label">Out of 3 max</p>
                </div>
              </div>
            </section>

            {/* Assigned Regions Section */}
            <section className="agent-user-regions-section">
              <div className="user-section-header">
                <h2 className="agent-user-section-title">Your Assigned Regions</h2>
                <a href="/dashboard/regions" className="user-view-more-btn">
                  View More
                </a>
              </div>
              <div className="agent-user-regions-grid">
                <div className="agent-user-region-card">
                  <div className="agent-user-region-district">District 1</div>
                  <div className="agent-user-region-location">CBD</div>
                </div>
                <div className="agent-user-region-card">
                  <div className="agent-user-region-district">District 9</div>
                  <div className="agent-user-region-location">Orchard</div>
                </div>
                <div className="agent-user-region-card">
                  <div className="agent-user-region-district">District 10</div>
                  <div className="agent-user-region-location">Tanglin</div>
                </div>
              </div>
            </section>

            {/* Your Listings Section */}
            <section className="agent-user-listings-section">
              <div className="user-section-header">
                <h2 className="agent-user-section-title">Your Recent Listings</h2>
                <a href="/dashboard/listings" className="user-view-more-btn">
                  View More
                </a>
              </div>
              <div className="agent-user-listings-grid">
                {listings.map((listing) => (
                  <div key={listing.id} className="agent-user-listing-card">
                    <img 
                      src={listing.image} 
                      alt={listing.address} 
                      className="agent-user-listing-image"
                    />
                    <div className="agent-user-listing-content">
                      <h3 className="agent-user-listing-address">{listing.address}</h3>
                      <p className="agent-user-listing-type">{listing.type}</p>
                      <span className={`agent-user-listing-status ${listing.status.toLowerCase().replace(' ', '-')}`}>
                        {listing.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Activity Section */}
            <section className="agent-user-activity-section">
              <h2 className="agent-user-section-title">Recent Activity</h2>
              <div className="agent-user-activity-list">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="agent-user-activity-item">
                    <div className={`agent-user-activity-icon ${activity.type}`}>
                      {activity.type === 'inquiry' ? '📧' : activity.type === 'status' ? '✅' : '🔔'}
                    </div>
                    <div className="agent-user-activity-content">
                      <h4 className="agent-user-activity-title">{activity.title}</h4>
                      <p className="agent-user-activity-details">{activity.details}</p>
                      <p className="agent-user-activity-time">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AgentUser;
