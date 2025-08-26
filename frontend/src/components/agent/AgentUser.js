import React, { useState, useEffect } from 'react';
import { useApi } from '../../context/ApiContext';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import { agentAPI, propertiesAPI } from '../../services/api';
import './agent-common.css';
import './AgentUser.css';

const AgentUser = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { getUserName } = useApi();
  const userName = getUserName();

  // State for real data
  const [stats, setStats] = useState({
    active_listings: 0,
    total_inquiries: 0,
    total_properties: 0,
    assigned_regions: 0,
    max_regions: 3
  });
  const [regions, setRegions] = useState([]);
  const [listings, setListings] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [statsData, regionsData, listingsData, activityData] = await Promise.all([
          agentAPI.getDashboardStats(),
          agentAPI.getAssignedRegions(),
          propertiesAPI.getAgentProperties(),
          agentAPI.getRecentActivity()
        ]);

        console.log('Dashboard Stats:', statsData);
        console.log('Regions Data:', regionsData);
        console.log('Listings Data:', listingsData);
        console.log('Activity Data:', activityData);

        // Ensure statsData has all required fields with fallbacks
        const safeStats = {
            active_listings: statsData.active_listings || 0,
            total_inquiries: statsData.total_inquiries || 0,
            total_properties: statsData.total_properties || 0,
            listing_views: statsData.listing_views || 0,
            assigned_regions: statsData.assigned_regions || 0,
            max_regions: statsData.max_regions || 3
        };

        setStats(safeStats);
        setRegions(regionsData.regions || []);
        setListings(listingsData || []); // Backend now returns array directly
        setRecentActivity(activityData.activities || []);
        
      } catch (error) {
        console.error('Error fetching agent data:', error);
        // Fallback to empty data
        setStats({ active_listings: 0, total_inquiries: 0, total_properties: 0, assigned_regions: 0, max_regions: 3 });
        setRegions([]);
        setListings([]);
        setRecentActivity([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
              {loading ? (
                <div className="agent-user-stats-grid">
                  <div className="agent-user-stat-card">
                    <h3>Loading...</h3>
                    <p className="agent-user-stat-number">-</p>
                    <p className="agent-user-stat-label">Please wait</p>
                  </div>
                </div>
              ) : (
                <div className="agent-user-stats-grid">
                  <div className="agent-user-stat-card">
                    <h3>Active Listings</h3>
                    <p className="agent-user-stat-number">{stats.active_listings || 0}</p>
                    <p className="agent-user-stat-label">Currently active</p>
                  </div>
                  
                  <div className="agent-user-stat-card">
                    <h3>Listing Views</h3>
                    <p className="agent-user-stat-number">{stats.listing_views ? stats.listing_views.toLocaleString() : '0'}</p>
                    <p className="agent-user-stat-label">Last 30 days</p>
                  </div>
                  
                  <div className="agent-user-stat-card">
                    <h3>Assigned Regions</h3>
                    <p className="agent-user-stat-number">{stats.assigned_regions || 0}</p>
                    <p className="agent-user-stat-label">Out of {stats.max_regions || 3} max</p>
                  </div>
                </div>
              )}
            </section>

            {/* Assigned Regions Section */}
            <section className="agent-user-regions-section">
              <div className="user-section-header">
                <h2 className="agent-user-section-title">Your Assigned Regions</h2>
                <a href="/dashboard/regions" className="user-view-more-btn">
                  View More
                </a>
              </div>
              {loading ? (
                <div className="agent-user-regions-grid">
                  <div className="agent-user-region-card">
                    <div className="agent-user-region-district">Loading...</div>
                    <div className="agent-user-region-location">Please wait</div>
                  </div>
                </div>
              ) : regions.length > 0 ? (
                <div className="agent-user-regions-grid">
                  {regions.map((region) => (
                    <div key={region.id} className="agent-user-region-card">
                      <div className="agent-user-region-district">{region.region_name}</div>
                      <div className="agent-user-region-location">{region.region_value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="agent-user-regions-grid">
                  <div className="agent-user-region-card">
                    <div className="agent-user-region-district">No regions assigned</div>
                    <div className="agent-user-region-location">Contact admin</div>
                  </div>
                </div>
              )}
            </section>

            {/* Your Listings Section */}
            <section className="agent-user-listings-section">
              <div className="user-section-header">
                <h2 className="agent-user-section-title">Your Recent Listings</h2>
                <a href="/dashboard/listings" className="user-view-more-btn">
                  View More
                </a>
              </div>
              {loading ? (
                <div className="agent-user-listings-grid">
                  <div className="agent-user-listing-card">
                    <div className="agent-user-listing-image" style={{backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      Loading...
                    </div>
                    <div className="agent-user-listing-content">
                      <h3 className="agent-user-listing-address">Loading...</h3>
                      <p className="agent-user-listing-type">Please wait</p>
                    </div>
                  </div>
                </div>
              ) : listings.length > 0 ? (
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
                        <p className="agent-user-listing-type">{listing.property_type}</p>
                        <span className={`agent-user-listing-status ${listing.status.toLowerCase().replace(' ', '-')}`}>
                          {listing.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="agent-user-listings-grid">
                  <div className="agent-user-listing-card">
                    <div className="agent-user-listing-image" style={{backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      No listings
                    </div>
                    <div className="agent-user-listing-content">
                      <h3 className="agent-user-listing-address">No listings yet</h3>
                      <p className="agent-user-listing-type">Start adding properties</p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Recent Activity Section */}
            <section className="agent-user-activity-section">
              <h2 className="agent-user-section-title">Recent Activity</h2>
              {loading ? (
                <div className="agent-user-activity-list">
                  <div className="agent-user-activity-item">
                    <div className="agent-user-activity-icon status">
                      ⏳
                    </div>
                    <div className="agent-user-activity-content">
                      <h4 className="agent-user-activity-title">Loading...</h4>
                      <p className="agent-user-activity-details">Please wait</p>
                    </div>
                  </div>
                </div>
              ) : recentActivity.length > 0 ? (
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
              ) : (
                <div className="agent-user-activity-list">
                  <div className="agent-user-activity-item">
                    <div className="agent-user-activity-icon status">
                      📭
                    </div>
                    <div className="agent-user-activity-content">
                      <h4 className="agent-user-activity-title">No recent activity</h4>
                      <p className="agent-user-activity-details">Start managing your properties</p>
                    </div>
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

export default AgentUser;
