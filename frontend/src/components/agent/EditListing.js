import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './agent-common.css';
import './EditListing.css';

const EditListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('listings');
  const [formData, setFormData] = useState({
    streetAddress: '123 Main St.',
    city: 'Anytown',
    state: 'CA',
    zipCode: '90210',
    propertyType: 'Office',
    size: '5,000',
    floors: '2',
    yearBuilt: '2005',
    zoning: 'Commercial',
    parkingSpaces: '50',
    askingPrice: '$1,500,000',
    priceType: 'sale',
    description: 'This is a well-maintained commercial property in a prime location with excellent accessibility and modern amenities.',
    status: 'Active',
    amenities: {
      hvac: true,
      securitySystem: false,
      loadingDocks: true,
      highCeilings: false,
      renovated: true
    }
  });

  const [uploadedImages, setUploadedImages] = useState([
    // Mock existing images - in real app, these would come from the listing data
    { id: 1, name: 'property-front.jpg', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop' },
    { id: 2, name: 'property-interior.jpg', url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop' }
  ]);

  const [newImages, setNewImages] = useState([]);

  // Load existing listing data from localStorage
  useEffect(() => {
    const loadListingData = () => {
      const savedListingData = localStorage.getItem('editingListingData');
      if (savedListingData) {
        try {
          const listingData = JSON.parse(savedListingData);
          
          // Update form data with the loaded listing data
          setFormData({
            streetAddress: listingData.streetAddress || listingData.address || '',
            city: listingData.city || '',
            state: listingData.state || '',
            zipCode: listingData.zipCode || '',
            propertyType: listingData.propertyType || '',
            size: listingData.size || '',
            floors: listingData.floors || '',
            yearBuilt: listingData.yearBuilt || '',
            zoning: listingData.zoning || '',
            parkingSpaces: listingData.parkingSpaces || '',
            askingPrice: listingData.askingPrice || '',
            priceType: listingData.priceType || 'sale',
            description: listingData.description || '',
            status: listingData.status || '',
            amenities: listingData.amenities || {
              hvac: false,
              securitySystem: false,
              loadingDocks: false,
              highCeilings: false,
              renovated: false
            }
          });

          // Update uploaded images if available
          if (listingData.image) {
            setUploadedImages([
              { 
                id: 1, 
                name: 'property-main.jpg', 
                url: listingData.image 
              }
            ]);
          }
        } catch (error) {
          console.error('Error loading listing data:', error);
          alert('Error loading listing data. Please try again.');
        }
      }
    };

    loadListingData();

    // Cleanup function to clear editing data when component unmounts
    return () => {
      // Only clear if we're navigating away without saving
      if (window.location.pathname !== '/dashboard/listings') {
        localStorage.removeItem('editingListingData');
      }
    };
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmenityChange = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenity]: !prev.amenities[amenity]
      }
    }));
  };

  const handlePriceTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      priceType: type
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setNewImages(prev => [...prev, ...files]);
  };

  const handleRemoveExistingImage = (imageId) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic form validation
    if (!formData.streetAddress || !formData.city || !formData.propertyType || !formData.askingPrice) {
      alert('Please fill in all required fields: Street Address, City, Property Type, and Asking Price');
      return;
    }
    
    if (!formData.status) {
      alert('Please select a status for the listing');
      return;
    }
    
    try {
      // Get the original listing data to preserve the ID and image
      const originalListingData = localStorage.getItem('editingListingData');
      let originalData = {};
      
      if (originalListingData) {
        originalData = JSON.parse(originalListingData);
      }

      // Create updated listing object
      const updatedListing = {
        ...originalData,
        streetAddress: formData.streetAddress,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        propertyType: formData.propertyType,
        size: formData.size,
        floors: formData.floors,
        yearBuilt: formData.yearBuilt,
        zoning: formData.zoning,
        parkingSpaces: formData.parkingSpaces,
        askingPrice: formData.askingPrice,
        priceType: formData.priceType,
        description: formData.description,
        status: formData.status,
        amenities: formData.amenities,
        // Update the address field to combine street address and city
        address: `${formData.streetAddress}, ${formData.city}, ${formData.state} ${formData.zipCode}`
      };

      // Get current listings from localStorage
      const currentListings = localStorage.getItem('agentListingsData');
      let allListings = [];
      
      if (currentListings) {
        allListings = JSON.parse(currentListings);
      }

      // Find and update the specific listing
      const updatedListings = allListings.map(listing => 
        listing.id === parseInt(id) ? updatedListing : listing
      );

      // Save updated listings back to localStorage
      localStorage.setItem('agentListingsData', JSON.stringify(updatedListings));
      
      // Clear the editing data
      localStorage.removeItem('editingListingData');
      
      console.log('Listing updated successfully:', updatedListing);
      
      // Show success message
      alert('Listing updated successfully!');
      
      // Navigate back to listings page
      navigate('/dashboard/listings');
    } catch (error) {
      console.error('Error updating listing:', error);
      alert('Error updating listing. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/listings');
  };

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          <div className="user-content-header">
            <h1 className="user-main-title">Edit Listing</h1>
          </div>
          
          <div className="edit-listing-content">
            <form onSubmit={handleSubmit} className="edit-listing-form">
              {/* Property Location Details */}
              <div className="edit-listing-form-section">
                <h2 className="edit-listing-section-title">Property Location Details</h2>
                <div className="edit-listing-form-grid">
                  <div className="edit-listing-form-group">
                    <label htmlFor="streetAddress">Street Address</label>
                    <input
                      type="text"
                      id="streetAddress"
                      name="streetAddress"
                      value={formData.streetAddress}
                      onChange={handleInputChange}
                      className="edit-listing-form-input"
                    />
                  </div>
                  <div className="edit-listing-form-group">
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="edit-listing-form-input"
                    />
                  </div>
                  <div className="edit-listing-form-group">
                    <label htmlFor="state">State</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="edit-listing-form-input"
                    />
                  </div>
                  <div className="edit-listing-form-group">
                    <label htmlFor="zipCode">Zip Code</label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="edit-listing-form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Property Specifics */}
              <div className="edit-listing-form-section">
                <h2 className="edit-listing-section-title">Property Specifics</h2>
                <div className="edit-listing-form-grid">
                  <div className="edit-listing-form-group">
                    <label htmlFor="propertyType">Property Type</label>
                    <select
                      id="propertyType"
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      className="edit-listing-form-select"
                    >
                      <option value="">Select Property Type</option>
                      <option value="Office">Office</option>
                      <option value="Warehouse">Warehouse</option>
                      <option value="Retail">Retail</option>
                      <option value="Land">Land</option>
                      <option value="Mixed-Use">Mixed-Use</option>
                      <option value="Industrial">Industrial</option>
                    </select>
                  </div>
                  <div className="edit-listing-form-group">
                    <label htmlFor="size">Size (sq ft)</label>
                    <input
                      type="text"
                      id="size"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      className="edit-listing-form-input"
                    />
                  </div>
                  <div className="edit-listing-form-group">
                    <label htmlFor="floors">Number of Floors</label>
                    <input
                      type="number"
                      id="floors"
                      name="floors"
                      value={formData.floors}
                      onChange={handleInputChange}
                      className="edit-listing-form-input"
                    />
                  </div>
                  <div className="edit-listing-form-group">
                    <label htmlFor="yearBuilt">Year Built</label>
                    <input
                      type="number"
                      id="yearBuilt"
                      name="yearBuilt"
                      value={formData.yearBuilt}
                      onChange={handleInputChange}
                      className="edit-listing-form-input"
                    />
                  </div>
                  <div className="edit-listing-form-group">
                    <label htmlFor="zoning">Zoning</label>
                    <input
                      type="text"
                      id="zoning"
                      name="zoning"
                      value={formData.zoning}
                      onChange={handleInputChange}
                      className="edit-listing-form-input"
                    />
                  </div>
                  <div className="edit-listing-form-group">
                    <label htmlFor="parkingSpaces">Parking Spaces</label>
                    <input
                      type="number"
                      id="parkingSpaces"
                      name="parkingSpaces"
                      value={formData.parkingSpaces}
                      onChange={handleInputChange}
                      className="edit-listing-form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="edit-listing-form-section">
                <h2 className="edit-listing-section-title">Amenities</h2>
                <div className="edit-listing-amenities-grid">
                  <label className="edit-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.hvac}
                      onChange={() => handleAmenityChange('hvac')}
                    />
                    HVAC
                  </label>
                  <label className="edit-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.securitySystem}
                      onChange={() => handleAmenityChange('securitySystem')}
                    />
                    Security System
                  </label>
                  <label className="edit-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.loadingDocks}
                      onChange={() => handleAmenityChange('loadingDocks')}
                    />
                    Loading Docks
                  </label>
                  <label className="edit-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.highCeilings}
                      onChange={() => handleAmenityChange('highCeilings')}
                    />
                    High Ceilings
                  </label>
                  <label className="edit-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.renovated}
                      onChange={() => handleAmenityChange('renovated')}
                    />
                    Renovated
                  </label>
                </div>
              </div>

              {/* Pricing */}
              <div className="edit-listing-form-section">
                <h2 className="edit-listing-section-title">Pricing</h2>
                <div className="edit-listing-form-group">
                  <label htmlFor="askingPrice">Asking Price/Rent</label>
                  <input
                    type="text"
                    id="askingPrice"
                    name="askingPrice"
                    value={formData.askingPrice}
                    onChange={handleInputChange}
                    className="edit-listing-form-input"
                  />
                  <div className="edit-listing-price-type-buttons">
                    <button
                      type="button"
                      className={`edit-listing-price-type-btn ${formData.priceType === 'sale' ? 'active' : ''}`}
                      onClick={() => handlePriceTypeChange('sale')}
                    >
                      Sale Price
                    </button>
                    <button
                      type="button"
                      className={`edit-listing-price-type-btn ${formData.priceType === 'rental' ? 'active' : ''}`}
                      onClick={() => handlePriceTypeChange('rental')}
                    >
                      Rental Price
                    </button>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="edit-listing-form-section">
                <h2 className="edit-listing-section-title">Description</h2>
                <div className="edit-listing-form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="edit-listing-form-textarea"
                    placeholder="Enter property description..."
                    rows="4"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="edit-listing-form-section">
                <h2 className="edit-listing-section-title">Status</h2>
                <div className="edit-listing-form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="edit-listing-form-select"
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Sold">Sold</option>
                    <option value="Under Contract">Under Contract</option>
                  </select>
                </div>
              </div>

              {/* Property Images */}
              <div className="edit-listing-form-section">
                <h2 className="edit-listing-section-title">Property Images</h2>
                <div className="edit-listing-form-group">
                  {/* Existing Images */}
                  {uploadedImages.length > 0 && (
                    <div className="edit-listing-existing-images">
                      <h3 className="edit-listing-subsection-title">Current Images</h3>
                      <div className="edit-listing-image-grid">
                        {uploadedImages.map((image) => (
                          <div key={image.id} className="edit-listing-existing-image-item">
                            <img
                              src={image.url}
                              alt={image.name}
                              className="edit-listing-existing-image"
                            />
                            <div className="edit-listing-image-overlay">
                              <button
                                type="button"
                                className="edit-listing-remove-image-btn"
                                onClick={() => handleRemoveExistingImage(image.id)}
                              >
                                ×
                              </button>
                            </div>
                            <span className="edit-listing-image-name">{image.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload New Images */}
                  <div className="edit-listing-image-upload-area">
                    <div className="edit-listing-upload-instructions">
                      Drag and drop or click to upload new images
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="edit-listing-file-input"
                      id="imageUpload"
                    />
                    <label htmlFor="imageUpload" className="edit-listing-upload-button">
                      Upload New Images
                    </label>
                  </div>

                  {/* New Images Preview */}
                  {newImages.length > 0 && (
                    <div className="edit-listing-new-images">
                      <h3 className="edit-listing-subsection-title">New Images</h3>
                      <div className="edit-listing-image-grid">
                        {newImages.map((file, index) => (
                          <div key={index} className="edit-listing-new-image-item">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`New ${index + 1}`}
                              className="edit-listing-new-image"
                            />
                            <span className="edit-listing-image-name">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="edit-listing-form-actions">
                <button type="button" className="edit-listing-btn-cancel" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="edit-listing-btn-save">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default EditListing;
