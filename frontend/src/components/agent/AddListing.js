import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import { agentAPI } from '../../services/api';
import { BACKEND_ORIGIN } from '../../services/api';
import { GOOGLE_MAPS_API_KEY } from '../../config/maps';
import './agent-common.css';
import './AddListing.css';

const GOOGLE_MAPS_LIBRARIES = ['places'];

function loadGoogleMaps(apiKey) {
  if (!apiKey) {
    return Promise.reject(new Error('Missing Google Maps API key'));
  }
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google);
  }
  if (window._googleMapsPromise) {
    return window._googleMapsPromise;
  }
  const script = document.createElement('script');
  const libs = GOOGLE_MAPS_LIBRARIES.join(',');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libs}`;
  script.async = true;
  script.defer = true;
  window._googleMapsPromise = new Promise((resolve, reject) => {
    script.onload = () => resolve(window.google);
    script.onerror = reject;
  });
  document.head.appendChild(script);
  return window._googleMapsPromise;
}

const AddListing = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('listings');
  const [formData, setFormData] = useState({
    streetAddress: '',
    zipCode: '',
    latitude: null,
    longitude: null,
    propertyType: '',
    size: '',
    floors: '',
    yearBuilt: '',
    zoning: '',
    parkingSpaces: '',
    askingPrice: '',
    priceType: 'sale',
    description: '',
    status: 'active',
    amenities: {
      hvac: false,
      securitySystem: false,
      loadingDocks: false,
      highCeilings: false,
      renovated: false,
      parking: false,
      modernAmenities: false,
      heritageFeatures: false,
      mallAccess: false,
      businessParkSetting: false,
      multipleUnits: false,
      sharedFacilities: false,
      flexibleLayout: false
    }
  });

  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [searchAddress, setSearchAddress] = useState(''); // For address autocomplete input
  
  // Google Maps autocomplete refs
  const autocompleteRef = useRef(null);
  const autocompleteInstanceRef = useRef(null);

  // Initialize Google Maps autocomplete
  useEffect(() => {
    const initializeAutocomplete = async () => {
      try {
        await loadGoogleMaps(GOOGLE_MAPS_API_KEY);
        
        if (autocompleteRef.current && window.google) {
          const autocomplete = new window.google.maps.places.Autocomplete(
            autocompleteRef.current,
            {
              componentRestrictions: { country: 'sg' }, // Restrict to Singapore
              fields: ['address_components', 'formatted_address', 'geometry', 'name']
            }
          );

          autocompleteInstanceRef.current = autocomplete;

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            
            if (!place || !place.geometry || !place.geometry.location) {
              console.log('No place data available');
              return;
            }

            // Get formatted address (this is what shows in the input)
            const formattedAddress = place.formatted_address || place.name || '';
            
            // Parse address components for street address and postal code
              let streetNumber = '';
              let route = '';
              let zipCode = '';

            if (place.address_components) {
              place.address_components.forEach(component => {
                const types = component.types;
                
                if (types.includes('street_number')) {
                  streetNumber = component.long_name;
                } else if (types.includes('route')) {
                  route = component.long_name;
                } else if (types.includes('postal_code')) {
                  zipCode = component.long_name;
                }
              });
            }

            // Build street address: if we have street_number and route, use them; otherwise use formatted address
            let streetAddress = '';
            if (streetNumber && route) {
              streetAddress = `${streetNumber} ${route}`.trim();
            } else if (route) {
              streetAddress = route;
            } else {
              // Fallback: use the formatted address but remove postal code if present
              streetAddress = formattedAddress.replace(/Singapore \d{6}/, '').trim();
            }

              // Update form data with parsed address and coordinates
              setFormData(prev => ({
                ...prev,
              streetAddress: streetAddress,
                zipCode: zipCode,
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng()
              }));

            // Update the search address state with formatted address
            setSearchAddress(formattedAddress);

              console.log('Address parsed:', {
              formattedAddress,
              streetAddress,
                zipCode,
                coordinates: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                }
              });
          });
        }
      } catch (error) {
        console.error('Failed to initialize Google Maps autocomplete:', error);
      }
    };

    initializeAutocomplete();
  }, []);

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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setIsUploadingImages(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      files.forEach(file => {
        formData.append('property_images', file);
      });
      
      console.log('Uploading property images...');
      const response = await agentAPI.uploadPropertyImages(formData);
      console.log('Upload response:', response);
      
      if (response.images) {
        // Add the uploaded images to the state
        setUploadedImages(prev => [...prev, ...response.images]);
        console.log('Images uploaded successfully');
      }
      
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error uploading images. Please try again.');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic form validation
    if (!formData.streetAddress || !formData.propertyType || !formData.askingPrice) {
      alert('Please fill in all required fields: Street Address, Property Type, and Asking Price');
      return;
    }
    
    if (!formData.status) {
      alert('Please select a status for the listing');
      return;
    }
    
    try {
      // Prepare the data for the API
      const newPropertyData = {
        title: `${formData.propertyType} - ${formData.streetAddress}`,
        description: formData.description,
        property_type: formData.propertyType,
        address: formData.zipCode ? `${formData.streetAddress}, Singapore ${formData.zipCode}` : `${formData.streetAddress}, Singapore`,
        street_address: formData.streetAddress,
        city: 'Singapore',
        state: 'Singapore',
        zip_code: formData.zipCode,
        latitude: formData.latitude,
        longitude: formData.longitude,
        size_sqft: parseFloat(formData.size) || 0,
        floors: parseInt(formData.floors) || 0,
        year_built: parseInt(formData.yearBuilt) || null,
        zoning: formData.zoning,
        parking_spaces: parseInt(formData.parkingSpaces) || 0,
        asking_price: parseFloat(formData.askingPrice) || 0,
        price_type: formData.priceType,
        status: formData.status,
        amenities: (() => {
          // Convert frontend amenity names to backend amenity names
          const reverseAmenityMap = {
            'hvac': 'Air Conditioning',
            'securitySystem': 'Security System',
            'loadingDocks': 'Loading Docks',
            'highCeilings': 'High Ceilings',
            'renovated': 'Renovated',
            'parking': 'Parking',
            'modernAmenities': 'Modern Amenities',
            'heritageFeatures': 'Heritage Features',
            'mallAccess': 'Mall Access',
            'businessParkSetting': 'Business Park Setting',
            'multipleUnits': 'Multiple Units',
            'sharedFacilities': 'Shared Facilities',
            'flexibleLayout': 'Flexible Layout'
          };
          
          const backendAmenities = {};
          for (const [frontendName, hasAmenity] of Object.entries(formData.amenities)) {
            if (hasAmenity) {
              const backendName = reverseAmenityMap[frontendName] || frontendName;
              backendAmenities[backendName] = true;
            }
          }
          return backendAmenities;
        })(),
        images: uploadedImages.map((image, index) => ({
          url: image.url && image.url.startsWith('http') ? image.url : `${BACKEND_ORIGIN || ''}${image.url}`,
          name: image.original_name || image.filename,
          is_primary: index === 0 // First image is primary
        }))
      };

      // Call the API to create the property
      console.log('Sending amenities to backend:', newPropertyData.amenities);
      console.log('Sending address to backend:', newPropertyData.address);
      const response = await agentAPI.createProperty(newPropertyData);
      
      console.log('Property created successfully:', response);
      
      // Show success message
      alert('Listing added successfully!');
      
      // Navigate back to listings page
      navigate('/dashboard/listings');
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Error creating listing. Please try again.');
    }
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
                  <div className="add-listing-form-group add-listing-form-group-full">
                    <label htmlFor="addressAutocomplete">Property Address (Start typing to search)</label>
                    <input
                      ref={autocompleteRef}
                      type="text"
                      id="addressAutocomplete"
                      name="addressAutocomplete"
                      value={searchAddress}
                      onChange={(e) => {
                        setSearchAddress(e.target.value);
                      }}
                      placeholder="Start typing the property address..."
                      className="add-listing-form-input add-listing-autocomplete-input"
                    />
                    <div className="add-listing-autocomplete-help">
                      💡 Start typing to see address suggestions from Google Maps
                    </div>
                  </div>
                  <div className="add-listing-form-group">
                    <label htmlFor="streetAddress">Street Address</label>
                    <input
                      type="text"
                      id="streetAddress"
                      name="streetAddress"
                      value={formData.streetAddress}
                      onChange={handleInputChange}
                      className="add-listing-form-input"
                      placeholder="Auto-filled from address search"
                    />
                  </div>
                  <div className="add-listing-form-group">
                    <label htmlFor="zipCode">Postal Code</label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="add-listing-form-input"
                      placeholder="Auto-filled from address search"
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
                      <optgroup label="Commercial">
                        <option value="Office">Office</option>
                        <option value="Retail">Retail</option>
                        <option value="Shop House">Shop House</option>
                      </optgroup>
                      <optgroup label="Industrial Property">
                        <option value="Business Parks">Business Parks</option>
                        <option value="Single-user Factory">Single-user Factory</option>
                        <option value="Multiple-user Factory">Multiple-user Factory</option>
                        <option value="Warehouse">Warehouse</option>
                      </optgroup>
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
                    <select
                      id="floors"
                      name="floors"
                      value={formData.floors}
                      onChange={handleInputChange}
                      className="add-listing-form-select"
                    >
                      <option value="">Select Number of Floors</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                      <option value="9">9</option>
                      <option value="10">10+</option>
                    </select>
                  </div>
                  <div className="add-listing-form-group">
                    <label htmlFor="yearBuilt">Year Built</label>
                    <select
                      id="yearBuilt"
                      name="yearBuilt"
                      value={formData.yearBuilt}
                      onChange={handleInputChange}
                      className="add-listing-form-select"
                    >
                      <option value="">Select Year Built</option>
                      {Array.from({ length: 100 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <option key={year} value={year.toString()}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="add-listing-form-group">
                    <label htmlFor="zoning">Zoning</label>
                    <select
                      id="zoning"
                      name="zoning"
                      value={formData.zoning}
                      onChange={handleInputChange}
                      className="add-listing-form-select"
                    >
                      <option value="">Select Zoning</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Business Park">Business Park</option>
                      <option value="Mixed Use">Mixed Use</option>
                      <option value="Warehouse">Warehouse</option>
                      <option value="Office">Office</option>
                      <option value="Retail">Retail</option>
                      <option value="Residential Commercial">Residential Commercial</option>
                      <option value="Light Industrial">Light Industrial</option>
                      <option value="Heavy Industrial">Heavy Industrial</option>
                      <option value="Business 1">Business 1</option>
                      <option value="Business 2">Business 2</option>
                      <option value="Business Park Zone">Business Park Zone</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="add-listing-form-group">
                    <label htmlFor="parkingSpaces">Parking Spaces</label>
                    <select
                      id="parkingSpaces"
                      name="parkingSpaces"
                      value={formData.parkingSpaces}
                      onChange={handleInputChange}
                      className="add-listing-form-select"
                    >
                      <option value="">Select Parking Spaces</option>
                      <option value="0">0 (No Parking)</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                      <option value="9">9</option>
                      <option value="10">10</option>
                      <option value="11-20">11-20</option>
                      <option value="21-30">21-30</option>
                      <option value="31-50">31-50</option>
                      <option value="51-100">51-100</option>
                      <option value="100+">100+</option>
                    </select>
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
                  <label className="add-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.parking}
                      onChange={() => handleAmenityChange('parking')}
                    />
                    Parking
                  </label>
                  <label className="add-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.modernAmenities}
                      onChange={() => handleAmenityChange('modernAmenities')}
                    />
                    Modern Amenities
                  </label>
                  <label className="add-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.heritageFeatures}
                      onChange={() => handleAmenityChange('heritageFeatures')}
                    />
                    Heritage Features
                  </label>
                  <label className="add-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.mallAccess}
                      onChange={() => handleAmenityChange('mallAccess')}
                    />
                    Mall Access
                  </label>
                  <label className="add-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.businessParkSetting}
                      onChange={() => handleAmenityChange('businessParkSetting')}
                    />
                    Business Park Setting
                  </label>
                  <label className="add-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.multipleUnits}
                      onChange={() => handleAmenityChange('multipleUnits')}
                    />
                    Multiple Units
                  </label>
                  <label className="add-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.sharedFacilities}
                      onChange={() => handleAmenityChange('sharedFacilities')}
                    />
                    Shared Facilities
                  </label>
                  <label className="add-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.flexibleLayout}
                      onChange={() => handleAmenityChange('flexibleLayout')}
                    />
                    Flexible Layout
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
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="sold">Sold</option>
                    <option value="under-contract">Under Contract</option>
                  </select>
                </div>
              </div>

              <div className="add-listing-form-section">
                <h2 className="add-listing-section-title">Upload Property Images</h2>
                <div className="add-listing-form-group">
                  <div className="add-listing-image-upload-area">
                    <div className="add-listing-upload-instructions">
                      {isUploadingImages ? 'Uploading images...' : 'Drag and drop or click to upload'}
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="add-listing-file-input"
                      id="imageUpload"
                      disabled={isUploadingImages}
                    />
                    <label htmlFor="imageUpload" className="add-listing-upload-button">
                      {isUploadingImages ? 'Uploading...' : 'Upload Images'}
                    </label>
                  </div>
                  {uploadedImages.length > 0 && (
                    <div className="add-listing-uploaded-images">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="add-listing-image-preview">
                          <img
                            src={image.url && image.url.startsWith('http') ? image.url : `${BACKEND_ORIGIN || ''}${image.url}`}
                            alt={`Preview ${index + 1}`}
                            className="add-listing-preview-image"
                          />
                          <div className="add-listing-image-info">
                            <span className="add-listing-image-name">{image.original_name || image.filename}</span>
                            <button
                              type="button"
                              className="add-listing-remove-image-btn"
                              onClick={() => removeImage(index)}
                              disabled={isUploadingImages}
                            >
                              Remove
                            </button>
                          </div>
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