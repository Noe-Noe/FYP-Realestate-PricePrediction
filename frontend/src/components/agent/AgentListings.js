import React, { useState, useEffect } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import { agentAPI } from '../../services/api';
import './agent-common.css';
import './AgentListings.css';

const AgentListings = () => {
  const [activeTab, setActiveTab] = useState('listings');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [removingListingId, setRemovingListingId] = useState(null);
  const [listingsData, setListingsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch listings data from API
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await agentAPI.getAgentProperties();
        console.log('Fetched listings:', response);
        
        // Transform the data to match the component's expected format
        const transformedListings = response.map(property => ({
          id: property.id,
          image: property.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=60&h=60&fit=crop',
          address: property.address,
          streetAddress: property.street_address,
          city: property.city,
          state: property.state,
          zipCode: property.zip_code,
          propertyType: property.property_type,
          size: property.size_sqft ? property.size_sqft.toString() : '0',
          floors: property.floors ? property.floors.toString() : '0',
          yearBuilt: property.year_built ? property.year_built.toString() : '',
          zoning: property.zoning,
          parkingSpaces: property.parking_spaces ? property.parking_spaces.toString() : '0',
          askingPrice: property.asking_price ? `S$${parseFloat(property.asking_price).toLocaleString()}` : 'S$0',
          priceType: property.price_type,
          description: property.description,
          status: property.status,
          amenities: {} // Will be populated when editing
        }));
        
        setListingsData(transformedListings);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError('Failed to load listings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  // Filter listings based on search query
  const filteredListings = listingsData.filter(listing =>
    listing.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.propertyType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.askingPrice.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleEdit = (listingId) => {
    // Navigate to the edit listing page - the EditListing component will fetch data from API
    window.location.href = `/dashboard/edit-listing/${listingId}`;
  };

  const handleRemove = async (listingId) => {
    console.log('Remove function called with ID:', listingId);
    
    // Check authentication
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('You must be logged in to delete listings.');
      return;
    }
    
    // Find the listing to get its address for confirmation
    const listingToRemove = listingsData.find(listing => listing.id === listingId);
    
    if (!listingToRemove) {
      alert('Listing not found!');
      return;
    }

    console.log('Found listing to remove:', listingToRemove);

    // Show confirmation dialog with listing details
    const confirmed = window.confirm(
      `Are you sure you want to remove this listing?\n\n` +
      `Address: ${listingToRemove.address}\n` +
      `Property Type: ${listingToRemove.propertyType}\n` +
      `Asking Price: ${listingToRemove.askingPrice}\n\n` +
      `This action cannot be undone.`
    );

    if (confirmed) {
      console.log('User confirmed removal');
      
      // Set loading state
      setRemovingListingId(listingId);
      
      try {
        console.log('Calling deleteProperty API with ID:', listingId);
        // Call the API to delete the property
        const response = await agentAPI.deleteProperty(listingId);
        console.log('Delete API response:', response);
        
        // Remove the listing from state
        setListingsData(prevListings => {
          const newListings = prevListings.filter(listing => listing.id !== listingId);
          console.log('New listings after removal:', newListings);
          return newListings;
        });
        
        // Show success message
        alert(`Listing removed successfully!\n\nAddress: ${listingToRemove.address}`);
        
        // Reset to first page if we're on a page that no longer exists
        const totalPages = Math.ceil((filteredListings.length - 1) / 10); // Assuming 10 items per page
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
        
      } catch (error) {
        console.error('Error removing listing:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response,
          status: error.status
        });
        alert(`Error removing listing: ${error.message || 'Please try again.'}`);
      } finally {
        // Clear loading state
        setRemovingListingId(null);
      }
    } else {
      console.log('User cancelled removal');
    }
  };

  const handleAddNewListing = () => {
    // Navigate to the add listing page
    window.location.href = '/dashboard/add-listing';
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'agent-listings-status active';
      case 'sold':
        return 'agent-listings-status sold';
      case 'under-contract':
        return 'agent-listings-status under-contract';
      default:
        return 'agent-listings-status';
    }
  };

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          <div className="user-content-header">
            <h1 className="user-main-title">Manage Listings</h1>
          </div>
          
          <div className="agent-listings-content">
            {/* Search Bar */}
            <div className="agent-listings-search-section">
              <div className="agent-listings-search-container">
                <span className="agent-listings-search-icon">🔍</span>
                <input
                  type="text"
                  className="agent-listings-search-input"
                  placeholder="Search by address, property type, or keywords"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="agent-listings-loading">
                <div className="loading-header">
                  <div className="skeleton-line long"></div>
                  <div className="skeleton-line medium"></div>
                </div>
                <div className="loading-content">
                  <div className="loading-spinner"></div>
                  <div className="loading-text">Loading your listings...</div>
                </div>
                <div className="loading-skeleton">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton-row">
                      <div className="skeleton-image"></div>
                      <div className="skeleton-content">
                        <div className="skeleton-line long"></div>
                        <div className="skeleton-line short"></div>
                        <div className="skeleton-line medium"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="agent-listings-error">
                <div className="agent-listings-error-icon">⚠️</div>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Try Again</button>
              </div>
            )}

            {/* Listings Table */}
            {!loading && !error && (
              <div className="agent-listings-table-container">
                {filteredListings.length === 0 ? (
                  <div className="agent-listings-empty">
                    <div className="agent-listings-empty-icon">🏠</div>
                    <p>No listings found</p>
                    {searchQuery ? (
                      <p className="empty-subtitle">Try adjusting your search terms</p>
                    ) : (
                      <p className="empty-subtitle">Get started by adding your first property listing</p>
                    )}
                  </div>
                ) : (
                  <table className="agent-listings-table">
                    <thead className="agent-listings-table-header">
                      <tr>
                        <th>Image</th>
                        <th>Address</th>
                        <th>Property Type</th>
                        <th>Size (sq ft)</th>
                        <th>Asking Price/Rent</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="agent-listings-table-body">
                      {filteredListings.map((listing) => (
                        <tr key={listing.id}>
                          <td>
                            <img 
                              src={listing.image} 
                              alt={listing.address}
                              className="agent-listings-property-image"
                            />
                          </td>
                          <td>
                            <div className="agent-listings-property-info">
                              <div className="agent-listings-property-address">{listing.address}</div>
                              <div className="agent-listings-property-type">{listing.propertyType}</div>
                            </div>
                          </td>
                          <td>{listing.propertyType}</td>
                          <td>{listing.size}</td>
                          <td>{listing.askingPrice}</td>
                          <td>
                            <span className={`agent-listings-status ${listing.status.toLowerCase()}`}>
                              {listing.status}
                            </span>
                          </td>
                          <td>
                            <div className="agent-listings-actions">
                              <button 
                                className="agent-listings-action-btn edit"
                                onClick={() => handleEdit(listing.id)}
                              >
                                Edit
                              </button>
                              <button 
                                className="agent-listings-action-btn remove"
                                onClick={() => {
                                  console.log('Remove button clicked for listing:', listing.id);
                                  handleRemove(listing.id);
                                }}
                                disabled={removingListingId === listing.id}
                              >
                                {removingListingId === listing.id ? 'Removing...' : 'Remove'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Add New Listing Button */}
            <div className="agent-listings-add-section">
              <button 
                className="agent-listings-add-btn"
                onClick={handleAddNewListing}
              >
                <span className="agent-listings-add-icon">➕</span>
                Add New Listing
              </button>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AgentListings;
