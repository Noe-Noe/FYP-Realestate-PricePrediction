import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GOOGLE_MAPS_API_KEY } from '../../config/maps';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './priceprediction.css';

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
const SEARCH_RADIUS_METERS = 1000;

const PricePrediction = () => {
  const [activeTab, setActiveTab] = useState('price-prediction');
  const location = useLocation();
  
  console.log('PricePrediction component loaded with location state:', location.state);
  
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
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();

  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geocoderRef = useRef(null);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);
  const lastLocationRef = useRef(null);

  // Get user type from localStorage
  const userType = localStorage.getItem('userType') || 'free';

  // Handle incoming state data from dashboard
  useEffect(() => {
    console.log('Location state changed:', location.state);
    if (location.state) {
      const { 
        prefillAddress, 
        prefillPropertyType, 
        prefillFloorArea, 
        prefillLevel, 
        prefillUnit, 
        fromBookmark 
      } = location.state;
      
      if (fromBookmark && prefillAddress) {
        console.log('Prefilling form with bookmark data:', { 
          prefillAddress, 
          prefillPropertyType, 
          prefillFloorArea, 
          prefillLevel, 
          prefillUnit 
        });
        
        // Prefill form with complete bookmark data
        setFormData({
          propertyType: prefillPropertyType || '',
          address: prefillAddress,
          floorArea: prefillFloorArea || '',
          level: prefillLevel || '',
          unit: prefillUnit || ''
        });
        
        // Set search address for map functionality
        setSearchAddress(prefillAddress);
        setClickedAddress(prefillAddress);
        
        console.log('Form prefilled with bookmark data:', {
          propertyType: prefillPropertyType,
          address: prefillAddress,
          floorArea: prefillFloorArea,
          level: prefillLevel,
          unit: prefillUnit
        });
      }
    }
  }, [location.state]);

  // Handle prefill address search when map becomes available
  useEffect(() => {
    if (mapInstanceRef.current && location.state?.fromBookmark && location.state?.prefillAddress) {
      const { prefillAddress } = location.state;
      setTimeout(() => {
        handleSearchAddressFromPrefill(prefillAddress);
      }, 500);
    }
  }, [mapInstanceRef.current, location.state]);

  // Debug: Log form data changes
  useEffect(() => {
    console.log('Form data changed:', formData);
  }, [formData]);



  const propertyTypes = [
    'Industrial Property',
    'Commercial Space',
    'Warehouse',
    'Office Space',
    'Retail Unit',
    'Factory Building'
  ];

  const levels = [
    'Ground Floor',
    'Level 1',
    'Level 2',
    'Level 3',
    'Level 4',
    'Level 5+'
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem('pricePredictionRecentSearches');
    if (savedSearches) {
      try {
        const parsed = JSON.parse(savedSearches);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('Loaded recent searches from localStorage:', parsed);
          setRecentSearches(parsed);
        }
      } catch (error) {
        console.error('Error parsing saved searches:', error);
        // Clear corrupted data
        localStorage.removeItem('pricePredictionRecentSearches');
        setRecentSearches([]);
      }
    } else {
      console.log('No recent searches found in localStorage');
    }
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    console.log('Initializing Google Maps...');
    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then((google) => {
        console.log('Google Maps loaded successfully');
        const mapDiv = document.getElementById('price-prediction-map');
        if (!mapDiv) {
          console.error('Map div not found');
          return;
        }
        console.log('Map div found, creating map instance');
        const map = new google.maps.Map(mapDiv, {
          center: DEFAULT_CENTER,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        mapInstanceRef.current = map;
        geocoderRef.current = new google.maps.Geocoder();
        console.log('Map instance created and stored in ref');

        // Map click -> reverse geocode + marker
        map.addListener('click', (e) => {
          const latLng = e.latLng;
          placeMarker(latLng);
          reverseGeocode(latLng);
        });

        // Autocomplete on input
        if (inputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
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
      })
      .catch((err) => {
        console.error('Error loading Google Maps:', err);
        setSearchError('Map failed to load. Please configure your Google Maps API key in src/config/maps.js or .env');
      });
  }, []);

  const placeMarker = (latLng) => {
    const google = window.google;
    if (!google || !mapInstanceRef.current) return;
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
    const marker = new google.maps.Marker({
      position: latLng,
      map: mapInstanceRef.current,
      animation: google.maps.Animation.DROP,
    });
    markerRef.current = marker;
    lastLocationRef.current = latLng;
  };

  const reverseGeocode = (latLng) => {
    const geocoder = geocoderRef.current;
    if (!geocoder) return;
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === 'OK' && results && results.length) {
        const result = results[0];
        const address = result.formatted_address;
        
        setClickedAddress(address);
        setSearchAddress(address);
        setFormData(prev => ({ ...prev, address: address }));
        setSearchError('');
        if (markerRef.current) {
          const infowindow = new window.google.maps.InfoWindow({
            content: `<div style="font-weight:600">${address}</div>`,
          });
          infowindow.open({ anchor: markerRef.current, map: mapInstanceRef.current });
        }
      }
    });
  };

  const handleSearchAddress = async () => {
    setSearchError('');
    const google = window.google;
    if (!google || !mapInstanceRef.current) {
      setSearchError('Map not ready. Please wait a moment and try again.');
      return;
    }
    if (!searchAddress || !searchAddress.trim()) return;
    setIsSearching(true);
    try {
      const geocoder = geocoderRef.current || new google.maps.Geocoder();
      geocoderRef.current = geocoder;
      
      // Check if input is a postal code (6 digits)
      const isPostalCode = /^\d{6}$/.test(searchAddress?.trim() || '');
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

  const handleSearchAddressFromPrefill = async (address) => {
    const google = window.google;
    if (!google || !mapInstanceRef.current) {
      console.log('Map not ready for prefill search');
      return;
    }
    
    try {
      const geocoder = geocoderRef.current || new google.maps.Geocoder();
      geocoderRef.current = geocoder;
      
      // Check if input is a postal code (6 digits)
      const isPostalCode = /^\d{6}$/.test(address?.trim() || '');
      const searchQuery = isPostalCode ? `${address}, Singapore` : `${address}, Singapore`;
      
      geocoder.geocode({ address: searchQuery }, (results, status) => {
        if (status === 'OK' && results && results.length) {
          const result = results[0];
          const latLng = result.geometry.location;
          
          mapInstanceRef.current.panTo(latLng);
          mapInstanceRef.current.setZoom(18);
          placeMarker(latLng);
          console.log(`✅ Prefill: Found address ${address} at location:`, latLng);
        } else {
          console.log(`❌ Prefill: No results found for address ${address}`);
        }
      });
    } catch (err) {
      console.error('Error in prefill address search:', err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchAddress();
    }
  };



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: value
      };
      console.log('Form data updated:', newFormData);
      return newFormData;
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.address || !formData.propertyType || !formData.floorArea || !formData.level || !formData.unit) {
      setSearchError('Please fill in all required fields');
      return;
    }
    
    // Save to recent searches (only if not from bookmark)
    if (!location.state?.fromBookmark) {
      const newSearch = {
        id: Date.now(), // Use timestamp as unique ID
        propertyType: formData.propertyType,
        address: formData.address,
        floorArea: formData.floorArea,
        level: formData.level,
        unit: formData.unit
      };
      
      // Add to beginning of recent searches (most recent first)
      const updatedSearches = [newSearch, ...recentSearches.filter(s => 
        s.address !== formData.address || s.propertyType !== formData.propertyType
      )].slice(0, 10); // Keep only last 10 searches
      
      // Update recent searches and save to localStorage
      setRecentSearches(updatedSearches);
      localStorage.setItem('pricePredictionRecentSearches', JSON.stringify(updatedSearches));
      
      console.log('Saved search to recent searches:', newSearch);
    }
    
    // Navigate to prediction results page with search data
    const searchData = {
      address: formData.address,
      propertyType: formData.propertyType,
      floorArea: formData.floorArea,
      level: formData.level,
      unit: formData.unit,
      fromBookmark: location.state?.fromBookmark || false
    };
    
    console.log('Navigating to prediction with data:', searchData);
    navigate('/dashboard/prediction', { state: { searchData } });
  };

  const handleRecentSearchClick = (search) => {
    setFormData({
      propertyType: search.propertyType,
      address: search.address,
      floorArea: search.floorArea || '',
      level: search.level || '',
      unit: search.unit || ''
    });
    setSearchAddress(search.address);
    setClickedAddress(search.address);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('pricePredictionRecentSearches');
  };

  const deleteRecentSearch = (searchId) => {
    const updatedSearches = recentSearches.filter(search => search.id !== searchId);
    setRecentSearches(updatedSearches);
    localStorage.setItem('pricePredictionRecentSearches', JSON.stringify(updatedSearches));
  };





  return (
    <div className="user-dashboard">
      {/* Top Header */}
      <Header />

      <div className="user-dashboard-container">
        {/* Left Sidebar */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content */}
        <main className="user-main-content">
                     <div className="user-content-header">
             <h1 className="user-main-title">Get Price Prediction</h1>
             {location.state?.fromBookmark && (
               <div className="bookmark-prefill-notice">
                 📚 Form prefilled from your bookmark
               </div>
             )}
           </div>

          <div className="price-prediction-search-section">
            <form onSubmit={handleSearch} className="price-prediction-search-form">
              <div className="price-prediction-form-group">
                <label htmlFor="propertyType">Property Type</label>
                <select
                  id="propertyType"
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select property type</option>
                  {propertyTypes.map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="price-prediction-form-group">
                 <label htmlFor="address">Address or Postal Code</label>
                 <div className="price-prediction-address-search-container">
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
                     className="price-prediction-address-search-btn" 
                     onClick={handleSearchAddress}
                     disabled={isSearching || !searchAddress?.trim()}
                   >
                     {isSearching ? 'Searching...' : 'Search'}
                   </button>
                 </div>
                 {searchError && (
                   <div className="price-prediction-search-error">{searchError}</div>
                 )}
                 <div className="price-prediction-search-hint">
                   <small>💡 You can search by address or enter a 6-digit Singapore postal code</small>
                 </div>
               </div>

              <div className="price-prediction-map-snippet">
                <div id="price-prediction-map" className="price-prediction-map-container"></div>
              </div>

              <div className="price-prediction-form-row">
                <div className="price-prediction-form-group">
                  <label htmlFor="floorArea">Floor Area (sq ft)</label>
                  <input
                    type="number"
                    id="floorArea"
                    name="floorArea"
                    value={formData.floorArea}
                    onChange={handleInputChange}
                    placeholder="Enter floor area"
                    required
                  />
                </div>

                <div className="price-prediction-form-group">
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

                <div className="price-prediction-form-group">
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

              <button type="submit" className="price-prediction-search-btn">
                Search
              </button>
            </form>
          </div>
        </main>

        {/* Right Sidebar - Recent Searches */}
        <aside className="price-prediction-recent-searches-sidebar">
          <div className="price-prediction-sidebar-header">
            <h2 className="price-prediction-sidebar-title">Recent Searches</h2>
            {recentSearches.length > 0 && (
              <button 
                className="price-prediction-clear-searches-btn"
                onClick={clearRecentSearches}
                title="Clear all recent searches"
              >
                🗑️
              </button>
            )}
          </div>
          <div className="price-prediction-recent-searches-list">
            {recentSearches.length > 0 ? (
              recentSearches.map((search) => (
                <div 
                  key={search.id} 
                  className="price-prediction-recent-search-item"
                >
                  <div 
                    className="price-prediction-search-content"
                    onClick={() => handleRecentSearchClick(search)}
                  >
                    <span className="price-prediction-search-icon">🔍</span>
                    <div className="price-prediction-search-details">
                      <div className="price-prediction-search-property-type">{search.propertyType}</div>
                      <div className="price-prediction-search-address">{search.address}</div>
                      <div className="price-prediction-search-details-row">
                        <span className="price-prediction-search-detail">
                          <strong>Area:</strong> {search.floorArea} sq ft
                        </span>
                        <span className="price-prediction-search-detail">
                          <strong>Level:</strong> {search.level}
                        </span>
                      </div>
                      {search.unit && (
                        <div className="price-prediction-search-detail">
                          <strong>Unit:</strong> {search.unit}
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    className="price-prediction-delete-search-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRecentSearch(search.id);
                    }}
                    title="Delete this search"
                  >
                    🗑️
                  </button>
                </div>
              ))
            ) : (
              <div className="price-prediction-no-searches">
                <span className="price-prediction-no-searches-icon">📝</span>
                <p>No recent searches yet</p>
                <small>Your search history will appear here</small>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PricePrediction;
