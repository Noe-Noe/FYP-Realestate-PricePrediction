import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import { agentAPI } from '../../services/api';
import { BACKEND_ORIGIN } from '../../services/api';
import { GOOGLE_MAPS_API_KEY } from '../../config/maps';
import './agent-common.css';
import './EditListing.css';

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

const EditListing = () => {
  const { id } = useParams();
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

  const [uploadedImages, setUploadedImages] = useState([
    // Mock existing images - in real app, these would come from the listing data
    { id: 1, name: 'property-front.jpg', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop' },
    { id: 2, name: 'property-interior.jpg', url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop' }
  ]);

  const [newImages, setNewImages] = useState([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  
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
              types: ['address'],
              componentRestrictions: { country: 'sg' }, // Restrict to Singapore
              fields: ['address_components', 'formatted_address', 'geometry']
            }
          );

          autocompleteInstanceRef.current = autocomplete;

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            
            if (place.geometry && place.address_components) {
              // Parse address components
              let streetNumber = '';
              let route = '';
              let zipCode = '';

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

              // Update form data with parsed address and coordinates
              setFormData(prev => ({
                ...prev,
                streetAddress: `${streetNumber} ${route}`.trim(),
                zipCode: zipCode,
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng()
              }));

              console.log('Address parsed:', {
                streetAddress: `${streetNumber} ${route}`.trim(),
                zipCode,
                coordinates: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                }
              });
            }
          });
        }
      } catch (error) {
        console.error('Failed to initialize Google Maps autocomplete:', error);
      }
    };

    initializeAutocomplete();
  }, []);

  // Load existing listing data from API
  useEffect(() => {
    const loadListingData = async () => {
      if (!id) {
        alert('No listing ID provided');
        navigate('/dashboard/listings');
        return;
      }

      // Check if user is authenticated
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('Please log in to edit listings');
        navigate('/login');
        return;
      }

      try {
        console.log('Fetching property with ID:', id);
        console.log('Using token:', token ? 'Token exists' : 'No token');
        
        console.log('Making API call to:', `/api/properties/agent/${id}`);
        const listingData = await agentAPI.getAgentProperty(id);
        console.log('Loaded listing data:', listingData);
        
        if (!listingData) {
          throw new Error('No data received from API');
        }
          
          // Update form data with the loaded listing data
          setFormData({
          streetAddress: listingData.street_address || listingData.address || '',
          zipCode: listingData.zip_code || '',
          latitude: listingData.latitude || null,
          longitude: listingData.longitude || null,
          propertyType: listingData.property_type || '',
          size: listingData.size_sqft ? listingData.size_sqft.toString() : '',
          floors: listingData.floors ? listingData.floors.toString() : '',
          yearBuilt: listingData.year_built ? listingData.year_built.toString() : '',
            zoning: listingData.zoning || '',
          parkingSpaces: listingData.parking_spaces ? listingData.parking_spaces.toString() : '',
          askingPrice: listingData.asking_price ? listingData.asking_price.toString() : '',
          priceType: listingData.price_type || 'sale',
            description: listingData.description || '',
          status: listingData.status || 'active',
          amenities: (() => {
            // Start with all amenities set to false
            const defaultAmenities = {
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
            };
            
            if (!listingData.amenities || !Array.isArray(listingData.amenities)) {
              return defaultAmenities;
            }
            
            // Map backend amenity names to frontend names
            const amenityMap = {
              'Air Conditioning': 'hvac',
              'HVAC': 'hvac',
              'Security System': 'securitySystem',
              'Parking': 'parking',
              'Loading Docks': 'loadingDocks',
              'High Ceilings': 'highCeilings',
              'Renovated': 'renovated',
              'Modern Amenities': 'modernAmenities',
              'Heritage Features': 'heritageFeatures',
              'Mall Access': 'mallAccess',
              'Business Park Setting': 'businessParkSetting',
              'Multiple Units': 'multipleUnits',
              'Shared Facilities': 'sharedFacilities',
              'Flexible Layout': 'flexibleLayout'
            };
            
            // Process each amenity from the backend
            listingData.amenities.forEach(amenity => {
              if (amenity && amenity.name && amenity.has_amenity !== undefined) {
                const frontendName = amenityMap[amenity.name] || amenity.name.toLowerCase().replace(/\s+/g, '');
                if (frontendName in defaultAmenities) {
                  defaultAmenities[frontendName] = amenity.has_amenity;
                }
              }
            });
            
                         return defaultAmenities;
           })()
        });
        
        console.log('Form data set:', {
          streetAddress: listingData.street_address || listingData.address || '',
          zipCode: listingData.zip_code || '',
          propertyType: listingData.property_type || '',
          size: listingData.size_sqft || '',
          askingPrice: listingData.asking_price || '',
          status: listingData.status || ''
        });
        
                 console.log('Status value loaded:', listingData.status);
         console.log('Form status set to:', listingData.status || 'active');
         console.log('Property type loaded:', listingData.property_type);
         console.log('Form property type set to:', listingData.property_type || '');
         console.log('Amenities loaded:', listingData.amenities);
         console.log('Amenities mapping process:');
         if (listingData.amenities) {
           listingData.amenities.forEach((amenity, index) => {
             console.log(`  Amenity ${index}:`, amenity);
             const amenityMap = {
               'Air Conditioning': 'hvac',
               'HVAC': 'hvac',
               'Security System': 'securitySystem',
               'Parking': 'parking',
               'Loading Docks': 'loadingDocks',
               'High Ceilings': 'highCeilings',
               'Renovated': 'renovated',
               'Modern Amenities': 'modernAmenities',
               'Heritage Features': 'heritageFeatures',
               'Mall Access': 'mallAccess',
               'Business Park Setting': 'businessParkSetting',
               'Multiple Units': 'multipleUnits',
               'Shared Facilities': 'sharedFacilities',
               'Flexible Layout': 'flexibleLayout'
             };
             const frontendName = amenityMap[amenity.name] || amenity.name.toLowerCase().replace(/\s+/g, '');
             console.log(`    Backend name: "${amenity.name}" -> Frontend name: "${frontendName}" -> Value: ${amenity.has_amenity}`);
           });
         }
         console.log('Final form amenities set to:', (() => {
           // Start with all amenities set to false
           const defaultAmenities = {
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
           };
           
           if (!listingData.amenities || !Array.isArray(listingData.amenities)) {
             return defaultAmenities;
           }
           
           // Map backend amenity names to frontend names
           const amenityMap = {
             'Air Conditioning': 'hvac',
             'HVAC': 'hvac',
             'Security System': 'securitySystem',
             'Parking': 'parking',
             'Loading Docks': 'loadingDocks',
             'High Ceilings': 'highCeilings',
             'Renovated': 'renovated',
             'Modern Amenities': 'modernAmenities',
             'Heritage Features': 'heritageFeatures',
             'Mall Access': 'mallAccess',
             'Business Park Setting': 'businessParkSetting',
             'Multiple Units': 'multipleUnits',
             'Shared Facilities': 'sharedFacilities',
             'Flexible Layout': 'flexibleLayout'
           };
           
           // Process each amenity from the backend
           listingData.amenities.forEach(amenity => {
             if (amenity && amenity.name && amenity.has_amenity !== undefined) {
               const frontendName = amenityMap[amenity.name] || amenity.name.toLowerCase().replace(/\s+/g, '');
               if (frontendName in defaultAmenities) {
                 defaultAmenities[frontendName] = amenity.has_amenity;
               }
             }
           });
           
           return defaultAmenities;
         })());

          // Update uploaded images if available
        if (listingData.images && listingData.images.length > 0) {
          setUploadedImages(listingData.images.map(img => ({
            id: img.id,
            name: img.name,
            url: img.url
          })));
        } else if (listingData.image) {
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
        
        // Check if it's an authentication error
        if (error.message && error.message.includes('401')) {
          alert('Please log in again to edit this listing.');
          navigate('/login');
          return;
        }
        
        // Check if it's a not found error
        if (error.message && error.message.includes('404')) {
          alert('Listing not found. It may have been deleted or you may not have permission to edit it.');
          navigate('/dashboard/listings');
          return;
        }
        
        // Generic error
        alert(`Error loading listing data: ${error.message || 'Please try again.'}`);
        navigate('/dashboard/listings');
      }
    };

    loadListingData();
  }, [id, navigate]);

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
      
      console.log('Uploading new property images...');
      const response = await agentAPI.uploadPropertyImages(formData);
      console.log('Upload response:', response);
      
      if (response.images) {
        // Add the uploaded images to the new images state
        setNewImages(prev => [...prev, ...response.images]);
        console.log('New images uploaded successfully');
      }
      
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error uploading images. Please try again.');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleRemoveExistingImage = (imageId) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleRemoveNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
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
      const updateData = {
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
          // Convert frontend amenity names back to backend amenity names
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
        images: [
          ...uploadedImages.map(img => ({
            url: img.url && img.url.startsWith('http') ? img.url : `${BACKEND_ORIGIN || ''}${img.url}`,
            name: img.name,
            is_primary: false
          })),
          ...newImages.map((img, index) => ({
            url: img.url && img.url.startsWith('http') ? img.url : `${BACKEND_ORIGIN || ''}${img.url}`,
            name: img.original_name || img.filename,
            is_primary: uploadedImages.length === 0 && index === 0 // First new image is primary if no existing images
          }))
        ]
      };

      // Call the API to update the property
      console.log('Sending amenities to backend:', updateData.amenities);
      console.log('Sending address to backend:', updateData.address);
      await agentAPI.updateProperty(id, updateData);
      
      console.log('Listing updated successfully');
      
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
                  <div className="edit-listing-form-group edit-listing-form-group-full">
                    <label htmlFor="addressAutocomplete">Property Address (Start typing to search)</label>
                    <input
                      ref={autocompleteRef}
                      type="text"
                      id="addressAutocomplete"
                      placeholder="Start typing the property address..."
                      className="edit-listing-form-input edit-listing-autocomplete-input"
                    />
                    <div className="edit-listing-autocomplete-help">
                      💡 Start typing to see address suggestions from Google Maps
                    </div>
                  </div>
                  <div className="edit-listing-form-group">
                    <label htmlFor="streetAddress">Street Address</label>
                    <input
                      type="text"
                      id="streetAddress"
                      name="streetAddress"
                      value={formData.streetAddress}
                      onChange={handleInputChange}
                      className="edit-listing-form-input"
                      placeholder="Auto-filled from address search"
                    />
                  </div>
                  <div className="edit-listing-form-group">
                    <label htmlFor="zipCode">Postal Code</label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="edit-listing-form-input"
                      placeholder="Auto-filled from address search"
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
                  <label className="edit-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.parking}
                      onChange={() => handleAmenityChange('parking')}
                    />
                    Parking
                  </label>
                  <label className="edit-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.modernAmenities}
                      onChange={() => handleAmenityChange('modernAmenities')}
                    />
                    Modern Amenities
                  </label>
                  <label className="edit-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.heritageFeatures}
                      onChange={() => handleAmenityChange('heritageFeatures')}
                    />
                    Heritage Features
                  </label>
                  <label className="edit-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.mallAccess}
                      onChange={() => handleAmenityChange('mallAccess')}
                    />
                    Mall Access
                  </label>
                  <label className="edit-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.businessParkSetting}
                      onChange={() => handleAmenityChange('businessParkSetting')}
                    />
                    Business Park Setting
                  </label>
                  <label className="edit-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.multipleUnits}
                      onChange={() => handleAmenityChange('multipleUnits')}
                    />
                    Multiple Units
                  </label>
                  <label className="edit-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.sharedFacilities}
                      onChange={() => handleAmenityChange('sharedFacilities')}
                    />
                    Shared Facilities
                  </label>
                  <label className="edit-listing-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.flexibleLayout}
                      onChange={() => handleAmenityChange('flexibleLayout')}
                    />
                    Flexible Layout
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
                    {/* Debug: Current status value */}
                    {/* Current status: {formData.status} */}
                    <option value="">Select Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="sold">Sold</option>
                    <option value="under-contract">Under Contract</option>
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
                      {isUploadingImages ? 'Uploading images...' : 'Drag and drop or click to upload new images'}
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="edit-listing-file-input"
                      id="imageUpload"
                      disabled={isUploadingImages}
                    />
                    <label htmlFor="imageUpload" className="edit-listing-upload-button">
                      {isUploadingImages ? 'Uploading...' : 'Upload New Images'}
                    </label>
                  </div>

                  {/* New Images Preview */}
                  {newImages.length > 0 && (
                    <div className="edit-listing-new-images">
                      <h3 className="edit-listing-subsection-title">New Images</h3>
                      <div className="edit-listing-image-grid">
                        {newImages.map((image, index) => (
                          <div key={index} className="edit-listing-new-image-item">
                            <img
                              src={image.url && image.url.startsWith('http') ? image.url : `${BACKEND_ORIGIN || ''}${image.url}`}
                              alt={`New ${index + 1}`}
                              className="edit-listing-new-image"
                            />
                            <div className="edit-listing-image-overlay">
                              <button
                                type="button"
                                className="edit-listing-remove-new-image-btn"
                                onClick={() => handleRemoveNewImage(index)}
                                disabled={isUploadingImages}
                              >
                                ×
                              </button>
                            </div>
                            <span className="edit-listing-image-name">{image.original_name || image.filename}</span>
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
