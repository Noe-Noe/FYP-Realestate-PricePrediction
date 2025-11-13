import React, { useEffect, useState, useRef } from 'react';
import './Explore.css';
import { GOOGLE_MAPS_API_KEY } from '../../config/maps';

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

const Explore = () => {
  const [searchAddress, setSearchAddress] = useState('');
  const [clickedAddress, setClickedAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedPropertyType, setSelectedPropertyType] = useState('');
  const [floorArea, setFloorArea] = useState('');
  const [showPropertyTypeDropdown, setShowPropertyTypeDropdown] = useState(false);

  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geocoderRef = useRef(null);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);

  const propertyTypes = [
    { value: 'commercial', label: 'Commercial', icon: '🏢' },
    { value: 'industrial', label: 'Industrial', icon: '🏭' },
    { value: 'office', label: 'Office', icon: '🏢' },
    { value: 'retail', label: 'Retail', icon: '🛍️' },
    { value: 'warehouse', label: 'Warehouse', icon: '🏭' },
    { value: 'factory', label: 'Factory', icon: '🏭' }
  ];

  const handlePropertyTypeSelect = (type) => {
    setSelectedPropertyType(type);
    setShowPropertyTypeDropdown(false);
  };

  const handlePredictPrice = () => {
    if (!clickedAddress) {
      alert('Please select a location first');
      return;
    }
    if (!selectedPropertyType) {
      alert('Please select a property type');
      return;
    }
    if (!floorArea) {
      alert('Please enter floor area');
      return;
    }
    
    // Here you would typically make an API call to get the prediction
    console.log('Prediction request:', {
      address: clickedAddress,
      propertyType: selectedPropertyType,
      floorArea: floorArea
    });
    
    // Show login/signup prompt
    const shouldLogin = window.confirm(
      'To get your property valuation prediction, you need to sign in or create an account.\n\n' +
      'Would you like to proceed to login/signup?'
    );
    
    if (shouldLogin) {
      // Redirect to login page or show login modal
      // You can replace this with your actual login/signup navigation
      window.location.href = '/login';
      // Alternative: window.location.href = '/signup';
    }
  };

  // Initialize Google Maps
  useEffect(() => {
    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then((google) => {
    const mapDiv = document.getElementById('mapdiv');
    if (!mapDiv) {
      console.error('Map div not found');
      return;
    }
        const map = new google.maps.Map(mapDiv, {
          center: DEFAULT_CENTER,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        mapInstanceRef.current = map;
        geocoderRef.current = new google.maps.Geocoder();

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
            setSearchError(''); // Clear any previous errors
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
    }
    markerRef.current = new google.maps.Marker({
      position: latLng,
      map: mapInstanceRef.current,
      animation: google.maps.Animation.DROP,
    });
  };

  const reverseGeocode = async (latLng) => {
    if (!geocoderRef.current) return;
    
    try {
      const result = await new Promise((resolve, reject) => {
        geocoderRef.current.geocode({ location: latLng }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            resolve(results[0]);
          } else {
            reject(new Error('Geocoding failed'));
          }
        });
      });
      
      const address = result.formatted_address;
      setClickedAddress(address);
      setSearchAddress(address);
      setSearchError('');
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setSearchError('Could not get address for this location.');
    }
  };

  const handleSearch = async () => {
    if (!searchAddress.trim()) {
      setSearchError('Please enter an address to search.');
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      const result = await new Promise((resolve, reject) => {
        geocoderRef.current.geocode({ address: searchAddress }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            resolve(results[0]);
          } else {
            reject(new Error('Geocoding failed'));
          }
        });
      });

      const latLng = result.geometry.location;
      mapInstanceRef.current.panTo(latLng);
      mapInstanceRef.current.setZoom(18);
      placeMarker(latLng);
      setClickedAddress(result.formatted_address);
      setSearchError('');
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Could not find this address. Please try a different search term.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="explore" id="intro">
      <h2 className="section-title">Explore Automated Valuations</h2>
      <div className="explore-header">
        <p className="section-subtitle">Estimate the value of your property now</p>
      </div>
      <div className="explore-types">
        <div className="type-pill">
          <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>🏢</span>
          <span>Commercial</span>
        </div>
        <div className="type-pill">
          <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>🏭</span>
          <span>Industrial</span>
        </div>
      </div>
      <div className="explore-grid">
        <div className="explore-form">
          <div className="form-row">
            <label>Address Search</label>
            <div className="search-container">
              <input
                ref={inputRef}
                type="text"
                className="search-input"
                placeholder="Search an address in Singapore (Google Places Autocomplete)"
                value={searchAddress}
                onChange={(e) => {
                  setSearchAddress(e.target.value);
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
                disabled={isSearching}
              />
              <button 
                className="search-btn" 
                onClick={handleSearch}
                type="button"
                disabled={isSearching || !searchAddress.trim()}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
            {searchError && (
              <div className="search-error">{searchError}</div>
            )}
          </div>
          {clickedAddress && (
            <div className="form-row">
              <label>Selected Location</label>
              <div className="selected-address">{clickedAddress}</div>
            </div>
          )}
          <div className="form-row two-cols">
            <div>
              <label>Property Type</label>
              <div className="input like-input" 
                   onClick={() => setShowPropertyTypeDropdown(!showPropertyTypeDropdown)}
                   style={{ cursor: 'pointer', position: 'relative' }}>
                {selectedPropertyType ? (
                  <span>
                    {propertyTypes.find(pt => pt.value === selectedPropertyType)?.icon} 
                    {propertyTypes.find(pt => pt.value === selectedPropertyType)?.label}
                  </span>
                ) : (
                  'Select Property Type'
                )}
                {showPropertyTypeDropdown && (
                  <div className="property-type-dropdown">
                    {propertyTypes.map((type) => (
                      <div 
                        key={type.value}
                        className="property-type-option"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePropertyTypeSelect(type.value);
                        }}
                      >
                        <span style={{ marginRight: '0.5rem' }}>{type.icon}</span>
                        {type.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label>Floor Area (sq ft)</label>
              <input
                type="number"
                className="search-input"
                placeholder="Enter floor area"
                value={floorArea}
                onChange={(e) => setFloorArea(e.target.value)}
                min="1"
              />
            </div>
          </div>
          <div className="form-row">
            <button 
              className="btn btn-primary" 
              onClick={handlePredictPrice}
              disabled={!clickedAddress || !selectedPropertyType || !floorArea}
            >
              Predict Price
            </button>
            <div className="hint">Sign in to view full prediction and data insights.</div>
          </div>
        </div>
        <div className="explore-image">
          <div id="mapdiv" style={{ height: '350px' }}></div>
          <div className="map-instructions">
            <p>Click the map or use search to pick a location.</p>
            <p><small>Select a location to get started with price prediction.</small></p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Explore;
