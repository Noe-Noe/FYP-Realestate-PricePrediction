import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './agent-common.css';
import './AddListing.css';

const AddListing = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('listings');
  const [formData, setFormData] = useState({
    streetAddress: '123 Main St.',
    city: 'Anytown',
    state: 'CA',
    zipCode: '90210',
    propertyType: '',
    size: '5,000',
    floors: '2',
    yearBuilt: '2005',
    zoning: 'Commercial',
    parkingSpaces: '50',
    askingPrice: '$1,500,000',
    priceType: 'sale',
    description: '',
    status: '',
    amenities: {
      hvac: false,
      securitySystem: false,
      loadingDocks: false,
      highCeilings: false,
      renovated: false
    }
  });

  const [uploadedImages, setUploadedImages] = useState([]);

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
    setUploadedImages(prev => [...prev, ...files]);
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
    
    console.log('Form submitted:', formData);
    console.log('Uploaded images:', uploadedImages);
    
    // Show success message
    alert('Listing added successfully!');
    
    // Navigate back to listings page
    navigate('/dashboard/listings');
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          <div className="user-content-header">
            <h1 className="user-main-title">Add New Listing</h1>
          </div>
          
          <div className="add-listing-content">
            <form onSubmit={handleSubmit} className="add-listing-form">
              <div className="add-listing-form-section">
                <h2 className="add-listing-section-title">Property Location Details</h2>
                <div className="add-listing-form-grid">
                  <div className="add-listing-form-group">
                    <label htmlFor="streetAddress">Street Address</label>
                    <input
                      type="text"
                      id="streetAddress"
                      name="streetAddress"
                      value={formData.streetAddress}
                      onChange={handleInputChange}
                      className="add-listing-form-input"
                    />
                  </div>
                  <div className="add-listing-form-group">
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="add-listing-form-input"
                    />
                  </div>
                  <div className="add-listing-form-group">
                    <label htmlFor="state">State</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="add-listing-form-input"
                    />
                  </div>
                  <div className="add-listing-form-group">
                    <label htmlFor="zipCode">Zip Code</label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="add-listing-form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="add-listing-form-section">
                <h2 className="add-listing-section-title">Property Specifics</h2>
                <div className="add-listing-form-grid">
                  <div className="add-listing-form-group">
                    <label htmlFor="propertyType">Property Type</label>
                    <select
                      id="propertyType"
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      className="add-listing-form-select"
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
                  <div className="add-listing-form-group">
                    <label htmlFor="size">Size (sq ft)</label>
                    <input
                      type="text"
                      id="size"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      className="add-listing-form-input"
                    />
                  </div>
                  <div className="add-listing-form-group">
                    <label htmlFor="floors">Number of Floors</label>
                    <input
                      type="number"
                      id="floors"
                      name="floors"
                      value={formData.floors}
                      onChange={handleInputChange}
                      className="add-listing-form-input"
                    />
                  </div>
                  <div className="add-listing-form-group">
                    <label htmlFor="yearBuilt">Year Built</label>
                    <input
                      type="number"
                      id="yearBuilt"
                      name="yearBuilt"
                      value={formData.yearBuilt}
                      onChange={handleInputChange}
                      className="add-listing-form-input"
                    />
                  </div>
                  <div className="add-listing-form-group">
                    <label htmlFor="zoning">Zoning</label>
                    <input
                      type="text"
                      id="zoning"
                      name="zoning"
                      value={formData.zoning}
                      onChange={handleInputChange}
                      className="add-listing-form-input"
                    />
                  </div>
                  <div className="add-listing-form-group">
                    <label htmlFor="parkingSpaces">Parking Spaces</label>
                    <input
                      type="number"
                      id="parkingSpaces"
                      name="parkingSpaces"
                      value={formData.parkingSpaces}
                      onChange={handleInputChange}
                      className="add-listing-form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="add-listing-form-section">
                <h2 className="add-listing-section-title">Amenities</h2>
                <div className="add-listing-amenities-grid">
                  <label className="add-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.hvac}
                      onChange={() => handleAmenityChange('hvac')}
                    />
                    HVAC
                  </label>
                  <label className="add-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.securitySystem}
                      onChange={() => handleAmenityChange('securitySystem')}
                    />
                    Security System
                  </label>
                  <label className="add-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.loadingDocks}
                      onChange={() => handleAmenityChange('loadingDocks')}
                    />
                    Loading Docks
                  </label>
                  <label className="add-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.highCeilings}
                      onChange={() => handleAmenityChange('highCeilings')}
                    />
                    High Ceilings
                  </label>
                  <label className="add-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.renovated}
                      onChange={() => handleAmenityChange('renovated')}
                    />
                    Renovated
                  </label>
                </div>
              </div>

              <div className="add-listing-form-section">
                <h2 className="add-listing-section-title">Pricing</h2>
                <div className="add-listing-form-group">
                  <label htmlFor="askingPrice">Asking Price/Rent</label>
                  <input
                    type="text"
                    id="askingPrice"
                    name="askingPrice"
                    value={formData.askingPrice}
                    onChange={handleInputChange}
                    className="add-listing-form-input"
                  />
                  <div className="add-listing-price-type-buttons">
                    <button
                      type="button"
                      className={`add-listing-price-type-btn ${formData.priceType === 'sale' ? 'active' : ''}`}
                      onClick={() => handlePriceTypeChange('sale')}
                    >
                      Sale Price
                    </button>
                    <button
                      type="button"
                      className={`add-listing-price-type-btn ${formData.priceType === 'rental' ? 'active' : ''}`}
                      onClick={() => handlePriceTypeChange('rental')}
                    >
                      Rental Price
                    </button>
                  </div>
                </div>
              </div>

              <div className="add-listing-form-section">
                <h2 className="add-listing-section-title">Description</h2>
                <div className="add-listing-form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="add-listing-form-textarea"
                    placeholder="Enter property description..."
                    rows="4"
                  />
                </div>
              </div>

              <div className="add-listing-form-section">
                <h2 className="add-listing-section-title">Status</h2>
                <div className="add-listing-form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="add-listing-form-select"
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Sold">Sold</option>
                    <option value="Under Contract">Under Contract</option>
                  </select>
                </div>
              </div>

              <div className="add-listing-form-section">
                <h2 className="add-listing-section-title">Upload Property Images</h2>
                <div className="add-listing-form-group">
                  <div className="add-listing-image-upload-area">
                    <div className="add-listing-upload-instructions">
                      Drag and drop or click to upload
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="add-listing-file-input"
                      id="imageUpload"
                    />
                    <label htmlFor="imageUpload" className="add-listing-upload-button">
                      Upload
                    </label>
                  </div>
                  {uploadedImages.length > 0 && (
                    <div className="add-listing-uploaded-images">
                      {uploadedImages.map((file, index) => (
                        <div key={index} className="add-listing-image-preview">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="add-listing-preview-image"
                          />
                          <span className="add-listing-image-name">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="add-listing-form-actions">
                <button type="button" className="add-listing-btn-cancel" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="add-listing-btn-save">
                  Save Listing
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

export default AddListing; 