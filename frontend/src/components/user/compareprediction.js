import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GOOGLE_MAPS_API_KEY } from '../../config/maps';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './compareprediction.css';

const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry'];

function loadGoogleMaps(apiKey) {
  if (!apiKey) {
    return Promise.reject(new Error('Missing Google Maps API key (set in src/config/maps.js or .env)'));
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

const DEFAULT_CENTER = { lat: 1.2868108, lng: 103.8545349 }; // SG center-ish

const ComparePrediction = () => {
  const [activeTab, setActiveTab] = useState('compare-predictions');
  const location = useLocation();
  
  console.log('ComparePrediction component loaded with location state:', location.state);
  
  const [mapInstance, setMapInstance] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [addedProperties, setAddedProperties] = useState([]);
  
  // Form state - matching priceprediction.js structure
  const [formData, setFormData] = useState({
    propertyType: '',
    address: '',
    floorArea: '',
    level: '',
    unit: ''
  });
  const [searchAddress, setSearchAddress] = useState('');
  const [clickedAddress, setClickedAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geocoderRef = useRef(null);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);
  const lastLocationRef = useRef(null);

  // Get user type from localStorage
  const userType = localStorage.getItem('userType') || 'free';

  // Property types and levels matching priceprediction.js
  const propertyTypes = [
    'Office',
    'Retail',
    'Shop House',
    'Single-user Factory',
    'Multiple-user Factory',
    'Warehouse',
    'Business Parks'
  ];

  const levels = [
    'Ground Floor',
    'Level 1',
    'Level 2',
    'Level 3',
    'Level 4',
    'Level 5+'
  ];

  const [recentComparisons, setRecentComparisons] = useState([]);

  // Load recent comparisons from localStorage
  useEffect(() => {
    const savedComparisons = localStorage.getItem('comparePredictionRecentComparisons');
    if (savedComparisons) {
      try {
        const parsed = JSON.parse(savedComparisons);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentComparisons(parsed);
        }
      } catch (error) {
        console.error('Error parsing saved comparisons:', error);
      }
    }
  }, []);

  // Handle incoming state data from dashboard
  useEffect(() => {
    if (location.state) {
      const { prefillComparison, fromBookmark } = location.state;
      
      if (fromBookmark && prefillComparison) {
        console.log('Prefilling comparison with:', prefillComparison);
        
        // Pre-populate the form with comparison data
        const property1 = {
          id: Date.now(),
          propertyType: prefillComparison.propertyType || 'Industrial Property',
          address: prefillComparison.address1 || prefillComparison.name.split(' vs. ')[0],
          floorArea: '1500',
          level: 'Ground Floor',
          unit: 'A-01'
        };
        
        const property2 = {
          id: Date.now() + 1,
          propertyType: prefillComparison.propertyType || 'Commercial Space',
          address: prefillComparison.address2 || prefillComparison.name.split(' vs. ')[1],
          floorArea: '2000',
          level: 'Level 1',
          unit: 'B-15'
        };
        
        console.log('Setting properties:', { property1, property2 });
        setAddedProperties([property1, property2]);
      }
    }
  }, [location.state]);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        await loadGoogleMaps(GOOGLE_MAPS_API_KEY);
        
        if (mapRef.current && !mapInstance) {
          const map = new window.google.maps.Map(mapRef.current, {
            center: DEFAULT_CENTER,
            zoom: 11,
            mapTypeId: window.google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          });
          
          setMapInstance(map);
          mapInstanceRef.current = map;
          geocoderRef.current = new window.google.maps.Geocoder();
          
          // Add click listener to map
          map.addListener('click', (event) => {
            const latLng = event.latLng;
            placeMarker(latLng);
            reverseGeocode(latLng);
          });

          // Autocomplete on input
          if (inputRef.current) {
            const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
              componentRestrictions: { country: 'sg' },
              fields: ['geometry', 'formatted_address', 'name'],
            });
            autocompleteRef.current = autocomplete;
            autocomplete.addListener('place_changed', () => {
              const place = autocomplete.getPlace();
              if (!place || !place.geometry || !place.geometry.location) return;
              
              const latLng = place.geometry.location;
              map.panTo(latLng);
              map.setZoom(18);
              placeMarker(latLng);
              const address = place.formatted_address || place.name || '';
              setClickedAddress(address);
              setSearchAddress(address);
              setFormData(prev => ({ ...prev, address: address }));
              setSearchError('');
            });
          }
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    initMap();
  }, [mapInstance]);

  const placeMarker = (latLng) => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }
    
    markerRef.current = new window.google.maps.Marker({
      position: latLng,
      map: mapInstanceRef.current,
      animation: window.google.maps.Animation.DROP
    });
  };

  const reverseGeocode = (latLng) => {
    const geocoder = geocoderRef.current || new window.google.maps.Geocoder();
    geocoderRef.current = geocoder;
    
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === 'OK' && results && results.length) {
        const address = results[0].formatted_address;
        setClickedAddress(address);
        setSearchAddress(address);
        setFormData(prev => ({ ...prev, address: address }));
      }
    });
  };

  const handleSearchAddress = () => {
    if (!searchAddress.trim()) return;
    setIsSearching(true);
    try {
      const geocoder = geocoderRef.current || new window.google.maps.Geocoder();
      geocoderRef.current = geocoder;
      
      // Check if input is a postal code (6 digits)
      const isPostalCode = /^\d{6}$/.test(searchAddress.trim());
      const searchQuery = isPostalCode ? `${searchAddress}, Singapore` : `${searchAddress}, Singapore`;
      
      geocoder.geocode({ address: searchQuery }, (results, status) => {
        if (status === 'OK' && results && results.length) {
          const result = results[0];
          const latLng = result.geometry.location;
          
          mapInstanceRef.current.panTo(latLng);
          mapInstanceRef.current.setZoom(18);
          placeMarker(latLng);
          const address = result.formatted_address;
          setClickedAddress(address);
          setSearchAddress(address);
          setFormData(prev => ({ ...prev, address: address }));
          
          // Show success message for postal code
          if (isPostalCode) {
            console.log(`✅ Found address for postal code ${searchAddress}: ${address}`);
          }
        } else {
          if (isPostalCode) {
            setSearchError('No results found for this postal code. Please check the postal code.');
          } else {
            setSearchError('No results found for this address.');
          }
        }
        setIsSearching(false);
      });
    } catch (err) {
      setSearchError('Error searching address.');
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchAddress();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validate floorArea to prevent negative values and zero
    if (name === 'floorArea') {
      const numValue = parseFloat(value);
      if (value !== '' && (isNaN(numValue) || numValue <= 0)) {
        setSearchError('Floor area must be greater than 0');
        return;
      }
      setSearchError(''); // Clear error if valid
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddProperty = () => {
    if (!formData.propertyType || !formData.address || !formData.floorArea || !formData.level) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate floorArea is positive
    const floorAreaNum = parseFloat(formData.floorArea);
    if (isNaN(floorAreaNum) || floorAreaNum <= 0) {
      alert('Floor area must be greater than 0');
      return;
    }

    if (addedProperties.length >= 2) {
      alert('You can only compare up to 2 properties');
      return;
    }

    const newProperty = {
      id: Date.now(),
      propertyType: formData.propertyType,
      address: formData.address,
      floorArea: formData.floorArea,
      level: formData.level,
      unit: formData.unit || 'N/A'
    };

    setAddedProperties(prev => [...prev, newProperty]);
    
    // Clear form
    setFormData({
      propertyType: '',
      address: '',
      floorArea: '',
      level: '',
      unit: ''
    });
    setSearchAddress('');
    setClickedAddress('');
    setSearchError('');
    
    // Clear marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
  };

  const handleRemoveProperty = (propertyId) => {
    setAddedProperties(prev => prev.filter(prop => prop.id !== propertyId));
  };

  const handleCompare = () => {
    if (addedProperties.length !== 2) {
      alert('Please add exactly 2 properties to compare');
      return;
    }
    
    // Save to recent comparisons
    const newComparison = {
      id: Date.now(),
      property1: {
        propertyType: addedProperties[0].propertyType,
        address: addedProperties[0].address,
        floorArea: addedProperties[0].floorArea,
        level: addedProperties[0].level,
        unit: addedProperties[0].unit
      },
      property2: {
        propertyType: addedProperties[1].propertyType,
        address: addedProperties[1].address,
        floorArea: addedProperties[1].floorArea,
        level: addedProperties[1].level,
        unit: addedProperties[1].unit
      }
    };
    
    // Add to beginning of recent comparisons (most recent first)
    const updatedComparisons = [newComparison, ...recentComparisons.filter(c => 
      c.property1.address !== addedProperties[0].address || 
      c.property2.address !== addedProperties[1].address
    )].slice(0, 10); // Keep only last 10 comparisons
    
    // Update recent comparisons and save to localStorage
    setRecentComparisons(updatedComparisons);
    localStorage.setItem('comparePredictionRecentComparisons', JSON.stringify(updatedComparisons));
    
    // Navigate to comparison results page
    navigate('/dashboard/comparison', { 
      state: { properties: addedProperties } 
    });
  };

  const handleRecentComparisonClick = (comparison) => {
    // Clear current properties
    setAddedProperties([]);
    
    // Add the two properties from the recent comparison
    const property1 = {
      id: Date.now(),
      propertyType: comparison.property1.propertyType,
      address: comparison.property1.address,
      floorArea: comparison.property1.floorArea,
      level: comparison.property1.level || 'Ground Floor',
      unit: comparison.property1.unit || 'N/A'
    };
    
    const property2 = {
      id: Date.now() + 1,
      propertyType: comparison.property2.propertyType,
      address: comparison.property2.address,
      floorArea: comparison.property2.floorArea,
      level: comparison.property2.level || 'Ground Floor',
      unit: comparison.property2.unit || 'N/A'
    };
    
    setAddedProperties([property1, property2]);
  };

  const clearRecentComparisons = () => {
    setRecentComparisons([]);
    localStorage.removeItem('comparePredictionRecentComparisons');
  };

  const deleteRecentComparison = (comparisonId) => {
    const updatedComparisons = recentComparisons.filter(comparison => comparison.id !== comparisonId);
    setRecentComparisons(updatedComparisons);
    localStorage.setItem('comparePredictionRecentComparisons', JSON.stringify(updatedComparisons));
  };

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          <div className="user-content-header">
            <h1 className="user-main-title">Compare Predictions (Max 2 Properties)</h1>
          </div>

          <div className="compare-prediction-search-section">
            
            <div className="compare-prediction-select-properties-section">              
              <form className="compare-prediction-search-form">
                <div className="compare-prediction-form-group">
                  <label htmlFor="propertyType">Property Type</label>
                  <select
                    id="propertyType"
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select property type</option>
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

                <div className="compare-prediction-form-group">
                  <label htmlFor="address">Address or Postal Code</label>
                  <div className="compare-prediction-address-search-container">
                    <input
                      ref={inputRef}
                      type="text"
                      id="address"
                      name="address"
                      value={searchAddress}
                      onChange={(e) => {
                        setSearchAddress(e.target.value);
                        setFormData(prev => ({ ...prev, address: e.target.value }));
                        if (e.target.value === '') {
                          setSearchError('');
                          setClickedAddress('');
                          if (markerRef.current) {
                            markerRef.current.setMap(null);
                            markerRef.current = null;
                          }
                        }
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="Search for address or enter 6-digit postal code"
                      disabled={isSearching}
                      required
                    />
                    <button 
                      type="button"
                      className="compare-prediction-address-search-btn" 
                      onClick={handleSearchAddress}
                      disabled={isSearching || !searchAddress.trim()}
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  {searchError && (
                    <div className="compare-prediction-search-error">{searchError}</div>
                  )}
                  <div className="compare-prediction-search-hint">
                    <small>💡 You can search by address or enter a 6-digit Singapore postal code</small>
                  </div>
                </div>

                <div className="compare-prediction-map-snippet">
                  <div ref={mapRef} className="compare-prediction-map-container"></div>
                </div>

                <div className="compare-prediction-form-row">
                  <div className="compare-prediction-form-group">
                    <label htmlFor="floorArea">Floor Area (sq ft)</label>
                    <input
                      type="number"
                      id="floorArea"
                      name="floorArea"
                      value={formData.floorArea}
                      onChange={handleInputChange}
                      placeholder="Enter floor area"
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="compare-prediction-form-group">
                    <label htmlFor="level">Level</label>
                    <select
                      id="level"
                      name="level"
                      value={formData.level}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select level</option>
                      {levels.map((level, index) => (
                        <option key={index} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>

                  <div className="compare-prediction-form-group">
                    <label htmlFor="unit">Unit</label>
                    <input
                      type="text"
                      id="unit"
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      placeholder="Enter unit number"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="button"
                  className="compare-prediction-add-property-btn"
                  onClick={handleAddProperty}
                  disabled={addedProperties.length >= 2}
                >
                  Add Property ({addedProperties.length}/2)
                </button>
              </form>
              
              {addedProperties.length > 0 && (
                <div className="compare-prediction-added-properties">
                  <h3>Added Properties:</h3>
                  {addedProperties.map((property, index) => (
                    <div key={property.id} className="compare-prediction-property-item">
                      <span className="compare-prediction-property-number">Property {index + 1}:</span>
                      <span className="compare-prediction-property-details">
                        {property.propertyType} - {property.address} ({property.floorArea} sq ft, {property.level}
                        {property.unit && property.unit !== 'N/A' ? `, Unit ${property.unit}` : ''})
                      </span>
                      <button 
                        className="compare-prediction-remove-property-btn"
                        onClick={() => handleRemoveProperty(property.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="compare-prediction-compare-section">
              <button 
                className="compare-prediction-compare-btn"
                onClick={handleCompare}
                disabled={addedProperties.length !== 2}
              >
                Compare Properties
              </button>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Recent Comparisons */}
        <aside className="compare-prediction-recent-comparisons-sidebar">
          <div className="compare-prediction-sidebar-header">
            <h2 className="compare-prediction-sidebar-title">Recent Comparisons</h2>
            {recentComparisons.length > 0 && (
              <button 
                className="compare-prediction-clear-comparisons-btn"
                onClick={clearRecentComparisons}
                title="Clear all recent comparisons"
              >
                🗑️
              </button>
            )}
          </div>
          <div className="compare-prediction-recent-comparisons-list">
            {recentComparisons.length > 0 ? (
              recentComparisons.map((comparison) => (
                <div 
                  key={comparison.id} 
                  className="compare-prediction-recent-comparison-item"
                >
                  <div 
                    className="compare-prediction-comparison-content"
                    onClick={() => handleRecentComparisonClick(comparison)}
                  >
                  <span className="compare-prediction-comparison-icon">⚖️</span>
                  <div className="compare-prediction-comparison-details">
                    <div className="compare-prediction-comparison-property1">
                      <div className="compare-prediction-property-type">{comparison.property1.propertyType}</div>
                      <div className="compare-prediction-property-address">{comparison.property1.address}</div>
                      <div className="compare-prediction-property-details-row">
                        <span className="compare-prediction-property-detail">
                          <strong>Area:</strong> {comparison.property1.floorArea} sq ft
                        </span>
                        <span className="compare-prediction-property-detail">
                          <strong>Level:</strong> {comparison.property1.level}
                        </span>
                      </div>
                      {comparison.property1.unit && comparison.property1.unit !== 'N/A' && (
                        <div className="compare-prediction-property-detail">
                          <strong>Unit:</strong> {comparison.property1.unit}
                        </div>
                      )}
                    </div>
                    <div className="compare-prediction-comparison-vs">vs</div>
                    <div className="compare-prediction-comparison-property2">
                      <div className="compare-prediction-property-type">{comparison.property2.propertyType}</div>
                      <div className="compare-prediction-property-address">{comparison.property2.address}</div>
                      <div className="compare-prediction-property-details-row">
                        <span className="compare-prediction-property-detail">
                          <strong>Area:</strong> {comparison.property2.floorArea} sq ft
                        </span>
                        <span className="compare-prediction-property-detail">
                          <strong>Level:</strong> {comparison.property2.level}
                        </span>
                      </div>
                      {comparison.property2.unit && comparison.property2.unit !== 'N/A' && (
                        <div className="compare-prediction-property-detail">
                          <strong>Unit:</strong> {comparison.property2.unit}
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                  <button 
                    className="compare-prediction-delete-comparison-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRecentComparison(comparison.id);
                    }}
                    title="Delete this comparison"
                  >
                    🗑️
                  </button>
                </div>
              ))
            ) : (
              <div className="compare-prediction-no-comparisons">
                <span className="compare-prediction-no-comparisons-icon">📊</span>
                <p>No recent comparisons yet</p>
                <small>Your comparison history will appear here</small>
              </div>
            )}
          </div>
        </aside>
      </div>
      <Footer />
    </div>
  );
};

export default ComparePrediction;
