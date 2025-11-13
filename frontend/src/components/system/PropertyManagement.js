import React, { useState, useEffect } from 'react';
import { authAPI, propertiesAPI } from '../../services/api';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './PropertyManagement.css';

const PropertyManagement = () => {
  const [activeTab, setActiveTab] = useState('properties');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('all');
  
  // State for real data
  const [propertyList, setPropertyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProperties, setTotalProperties] = useState(0);
  const [propertyStats, setPropertyStats] = useState({
    total_active: 0,
    total_pending: 0,
    total_sold: 0,
    total_under_contract: 0
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [propertyImages, setPropertyImages] = useState([]);

  // Fetch real data from backend
  useEffect(() => {
    fetchPropertyData();
  }, [currentPage]);

  const fetchPropertyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch properties with pagination
      const propertyResponse = await authAPI.getAllPropertiesAdmin(currentPage, 8);
      setPropertyList(propertyResponse.properties || []);
      setTotalProperties(propertyResponse.total || 0);
      setTotalPages(propertyResponse.pages || Math.ceil((propertyResponse.total || 0) / 8));
      // Use statistics from backend (total counts, not page counts)
      if (propertyResponse.statistics) {
        setPropertyStats(propertyResponse.statistics);
      }
      
    } catch (err) {
      console.error('Error fetching property data:', err);
      setError(err.message || 'Failed to fetch property data');
    } finally {
      setLoading(false);
    }
  };

  // Filter properties based on search query and filters
  const filteredProperties = propertyList.filter(property => {
    const matchesSearch = 
      property.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.agent_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.agent_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    const matchesType = propertyTypeFilter === 'all' || property.property_type === propertyTypeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleViewDetails = async (propertyId) => {
    try {
      setLoading(true);
      // Fetch full property details
      const propertyDetails = await propertiesAPI.getById(propertyId);
      console.log('Property details fetched:', propertyDetails);
      console.log('Amenities:', propertyDetails.amenities);
      setSelectedProperty(propertyDetails);
      
      // Extract and set images
      if (propertyDetails.images && propertyDetails.images.length > 0) {
        const imageUrls = propertyDetails.images.map(img => img.url || img.image_url);
        setPropertyImages(imageUrls);
      } else {
        setPropertyImages([]);
      }
      
      setCurrentImageIndex(0); // Reset to first image
      setShowDetailsModal(true);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch property details:', error);
      setError(error.message || 'Failed to fetch property details');
      alert(`Failed to load property details: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (propertyImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % propertyImages.length);
    }
  };

  const previousImage = () => {
    if (propertyImages.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + propertyImages.length) % propertyImages.length);
    }
  };

  const selectImage = (index) => {
    setCurrentImageIndex(index);
  };

  const handleDelete = async (propertyId) => {
    if (deleteConfirm !== propertyId) {
      setDeleteConfirm(propertyId);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await authAPI.deletePropertyAdmin(propertyId);
      // Remove from list
      setPropertyList(prevList => prevList.filter(prop => prop.id !== propertyId));
      setTotalProperties(prev => prev - 1);
      setDeleteConfirm(null);
      // Close modal if the deleted property was being viewed
      if (selectedProperty && selectedProperty.id === propertyId) {
        setShowDetailsModal(false);
        setSelectedProperty(null);
      }
      alert('Property deleted successfully');
      // Check if we need to go to previous page or refresh
      const remainingCount = propertyList.length - 1;
      if (remainingCount === 0 && currentPage > 1) {
        // If we deleted the last item on a page, go to previous page
        // This will trigger useEffect to fetch data for the new page
        setCurrentPage(prev => Math.max(1, prev - 1));
      } else {
          // Refresh data on current page
        setLoading(true);
        try {
          const propertyResponse = await authAPI.getAllPropertiesAdmin(currentPage, 8);
          setPropertyList(propertyResponse.properties || []);
          setTotalProperties(propertyResponse.total || 0);
          setTotalPages(propertyResponse.pages || Math.ceil((propertyResponse.total || 0) / 8));
          // Update statistics from backend
          if (propertyResponse.statistics) {
            setPropertyStats(propertyResponse.statistics);
          }
        } catch (err) {
          console.error('Error refreshing property data:', err);
          setError(err.message || 'Failed to refresh property data');
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Failed to delete property:', error);
      // Extract error message from various possible error formats
      let errorMessage = 'Failed to delete property';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.response && error.response.status) {
        errorMessage = `Failed to delete property (Status: ${error.response.status})`;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
      alert(`Failed to delete property: ${errorMessage}`);
      setDeleteConfirm(null);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price, priceType) => {
    const numPrice = parseFloat(price);
    if (priceType === 'rental') {
      return `$${(numPrice / 1000).toFixed(0)}k/month`;
    } else {
      if (numPrice >= 1000000) {
        return `$${(numPrice / 1000000).toFixed(1)}M`;
      } else {
        return `$${(numPrice / 1000).toFixed(0)}k`;
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          <div className="user-content-header">
            <h1 className="user-main-title">Property Management</h1>
            <p className="user-welcome-message">Manage all property listings</p>
          </div>
          
          <div className="property-management-content">
            {/* Filters Section */}
            <div className="property-management-filters">
              <div className="property-management-search">
                <input
                  type="text"
                  placeholder="Search by title, address, or agent..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="property-management-search-input"
                />
              </div>
              
              <div className="property-management-filter-group">
                <label>Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="property-management-filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="sold">Sold</option>
                  <option value="under-contract">Under Contract</option>
                </select>
              </div>
              
              <div className="property-management-filter-group">
                <label>Property Type:</label>
                <select
                  value={propertyTypeFilter}
                  onChange={(e) => setPropertyTypeFilter(e.target.value)}
                  className="property-management-filter-select"
                >
                  <option value="all">All Types</option>
                  <option value="Office">Office</option>
                  <option value="Retail">Retail</option>
                  <option value="Shop House">Shop House</option>
                  <option value="Single-user Factory">Single-user Factory</option>
                  <option value="Multiple-user Factory">Multiple-user Factory</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Business Parks">Business Parks</option>
                </select>
              </div>
            </div>

            {/* Stats Section */}
            <div className="property-management-stats">
              <div className="property-stat-card">
                <span className="property-stat-label">Total Properties</span>
                <span className="property-stat-value">{totalProperties}</span>
              </div>
              <div className="property-stat-card">
                <span className="property-stat-label">Active Listings</span>
                <span className="property-stat-value">
                  {propertyStats.total_active}
                </span>
              </div>
              <div className="property-stat-card">
                <span className="property-stat-label">Filtered Results</span>
                <span className="property-stat-value">{filteredProperties.length}</span>
              </div>
            </div>

            {/* Properties Table */}
            {loading ? (
              <div className="property-management-loading">Loading properties...</div>
            ) : error ? (
              <div className="property-management-error">Error: {error}</div>
            ) : filteredProperties.length > 0 ? (
              <div className="property-management-table-container">
                <table className="property-management-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Address</th>
                      <th>Agent</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProperties.map((property) => (
                      <tr key={property.id} className="property-management-row">
                        <td>{property.id}</td>
                        <td className="property-management-title">{property.title}</td>
                        <td>{property.property_type}</td>
                        <td className="property-management-address">
                          {property.address}, {property.city}
                        </td>
                        <td className="property-management-agent">
                          <div>{property.agent_name}</div>
                          <small>{property.agent_email}</small>
                        </td>
                        <td className="property-management-price">
                          {formatPrice(property.asking_price, property.price_type)}
                        </td>
                        <td>
                          <span className={`property-status-badge status-${property.status}`}>
                            {property.status}
                          </span>
                        </td>
                        <td>{formatDate(property.created_at)}</td>
                        <td className="property-management-actions">
                          <div className="property-actions-group">
                            <button
                              type="button"
                              className="property-view-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleViewDetails(property.id);
                              }}
                              title="View property details"
                              disabled={loading}
                            >
                              View
                            </button>
                            {deleteConfirm === property.id ? (
                              <div className="property-delete-confirm">
                                <button
                                  type="button"
                                  className="property-delete-btn-confirm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDelete(property.id);
                                  }}
                                  disabled={loading}
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  className="property-delete-btn-cancel"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDeleteConfirm(null);
                                  }}
                                  disabled={loading}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="property-delete-btn"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDelete(property.id);
                                }}
                                title="Delete property"
                                disabled={loading}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="property-management-no-data">No properties found</div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="property-management-pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="property-pagination-btn"
                >
                  Previous
                </button>
                <span className="property-pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="property-pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />

      {/* Property Details Modal */}
      {showDetailsModal && selectedProperty && (
        <div className="property-details-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="property-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="property-details-modal-header">
              <h2>Property Details</h2>
              <button
                className="property-details-modal-close"
                onClick={() => setShowDetailsModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="property-details-modal-content">
              {/* Property Images */}
              {propertyImages.length > 0 && (
                <div className="property-details-images">
                  <div className="property-details-image-container">
                    <img
                      src={propertyImages[currentImageIndex]}
                      alt={`${selectedProperty.title} - Image ${currentImageIndex + 1}`}
                      className="property-details-main-image"
                    />
                    
                    {/* Navigation Arrows */}
                    {propertyImages.length > 1 && (
                      <>
                        <button 
                          className="property-details-carousel-btn property-details-carousel-prev"
                          onClick={previousImage}
                          aria-label="Previous image"
                        >
                          ‹
                        </button>
                        <button 
                          className="property-details-carousel-btn property-details-carousel-next"
                          onClick={nextImage}
                          aria-label="Next image"
                        >
                          ›
                        </button>
                      </>
                    )}
                    
                    {/* Image Counter */}
                    {propertyImages.length > 1 && (
                      <div className="property-details-image-counter">
                        {currentImageIndex + 1} / {propertyImages.length}
                      </div>
                    )}
                  </div>
                  
                  {/* Thumbnail Navigation */}
                  {propertyImages.length > 1 && (
                    <div className="property-details-thumbnails">
                      {propertyImages.map((image, index) => (
                        <button
                          key={index}
                          className={`property-details-thumbnail ${index === currentImageIndex ? 'property-details-thumbnail-active' : ''}`}
                          onClick={() => selectImage(index)}
                          aria-label={`Go to image ${index + 1}`}
                        >
                          <img 
                            src={image} 
                            alt={`Thumbnail ${index + 1}`}
                            className="property-details-thumbnail-image"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Basic Information */}
              <div className="property-details-section">
                <h3>{selectedProperty.title}</h3>
                <p className="property-details-address">{selectedProperty.address}</p>
                <p className="property-details-price">
                  {formatPrice(selectedProperty.asking_price, selectedProperty.price_type)}
                </p>
              </div>

              {/* Property Details Grid */}
              <div className="property-details-grid">
                <div className="property-detail-item">
                  <span className="property-detail-label">Property Type:</span>
                  <span className="property-detail-value">{selectedProperty.property_type}</span>
                </div>
                <div className="property-detail-item">
                  <span className="property-detail-label">Size:</span>
                  <span className="property-detail-value">
                    {selectedProperty.size_sqft?.toLocaleString()} sq ft
                  </span>
                </div>
                <div className="property-detail-item">
                  <span className="property-detail-label">Price Type:</span>
                  <span className="property-detail-value">
                    {selectedProperty.price_type === 'rental' ? 'For Rent' : 'For Sale'}
                  </span>
                </div>
                <div className="property-detail-item">
                  <span className="property-detail-label">Status:</span>
                  <span className={`property-status-badge status-${selectedProperty.status}`}>
                    {selectedProperty.status}
                  </span>
                </div>
                {selectedProperty.floors && (
                  <div className="property-detail-item">
                    <span className="property-detail-label">Floors:</span>
                    <span className="property-detail-value">{selectedProperty.floors}</span>
                  </div>
                )}
                {selectedProperty.year_built && (
                  <div className="property-detail-item">
                    <span className="property-detail-label">Year Built:</span>
                    <span className="property-detail-value">{selectedProperty.year_built}</span>
                  </div>
                )}
                {selectedProperty.parking_spaces && (
                  <div className="property-detail-item">
                    <span className="property-detail-label">Parking Spaces:</span>
                    <span className="property-detail-value">{selectedProperty.parking_spaces}</span>
                  </div>
                )}
                {selectedProperty.zoning && (
                  <div className="property-detail-item">
                    <span className="property-detail-label">Zoning:</span>
                    <span className="property-detail-value">{selectedProperty.zoning}</span>
                  </div>
                )}
                <div className="property-detail-item">
                  <span className="property-detail-label">Created:</span>
                  <span className="property-detail-value">
                    {formatDate(selectedProperty.created_at)}
                  </span>
                </div>
                {selectedProperty.updated_at && (
                  <div className="property-detail-item">
                    <span className="property-detail-label">Last Updated:</span>
                    <span className="property-detail-value">
                      {formatDate(selectedProperty.updated_at)}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedProperty.description && (
                <div className="property-details-section">
                  <h4>Description</h4>
                  <p className="property-details-description">{selectedProperty.description}</p>
                </div>
              )}

              {/* Location Details */}
              <div className="property-details-section">
                <h4>Location</h4>
                <div className="property-details-location">
                  <p><strong>Address:</strong> {selectedProperty.address}</p>
                  {selectedProperty.street_address && (
                    <p><strong>Street:</strong> {selectedProperty.street_address}</p>
                  )}
                  <p>
                    <strong>City:</strong> {selectedProperty.city}, <strong>State:</strong> {selectedProperty.state}
                  </p>
                  <p><strong>Postal Code:</strong> {selectedProperty.zip_code}</p>
                  {selectedProperty.latitude && selectedProperty.longitude && (
                    <p>
                      <strong>Coordinates:</strong> {parseFloat(selectedProperty.latitude).toFixed(6)}, {parseFloat(selectedProperty.longitude).toFixed(6)}
                    </p>
                  )}
                </div>
              </div>

              {/* Agent Information */}
              <div className="property-details-section">
                <h4>Agent Information</h4>
                <div className="property-details-agent">
                  <p><strong>Agent Name:</strong> {selectedProperty.agent?.full_name || selectedProperty.agent_name || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedProperty.agent?.email || selectedProperty.agent_email || 'N/A'}</p>
                  {selectedProperty.agent?.phone_number && (
                    <p><strong>Phone:</strong> {selectedProperty.agent.phone_number}</p>
                  )}
                  {selectedProperty.agent?.license_number && (
                    <p><strong>License:</strong> {selectedProperty.agent.license_number}</p>
                  )}
                  {selectedProperty.agent?.company_name && (
                    <p><strong>Company:</strong> {selectedProperty.agent.company_name}</p>
                  )}
                </div>
              </div>

              {/* Amenities */}
              {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                <div className="property-details-section">
                  <h4>Amenities</h4>
                  <div className="property-details-amenities">
                    {selectedProperty.amenities.map((amenity, index) => (
                      <span key={index} className="property-amenity-badge">
                        {typeof amenity === 'string' ? amenity : (amenity.amenity_name || amenity.name || amenity)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="property-details-modal-footer">
              <button
                className="property-details-modal-btn-close"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyManagement;

