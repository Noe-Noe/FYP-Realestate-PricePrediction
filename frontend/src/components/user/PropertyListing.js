import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { GOOGLE_MAPS_API_KEY } from '../../config/maps';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import { propertiesAPI } from '../../services/api';
import './PropertyListing.css';

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

const PropertyListing = () => {
  const [activeTab, setActiveTab] = useState('property-listing');
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  const [amenities, setAmenities] = useState([]);
  const [isLoadingAmenities, setIsLoadingAmenities] = useState(false);
  const [amenitiesError, setAmenitiesError] = useState('');
  const [selectedAmenityTypes, setSelectedAmenityTypes] = useState([]);
  
  // Image carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState([]);
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Map and amenities refs
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const placesServiceRef = useRef(null);
  const mapInitializedRef = useRef(false);

  // Function to generate initials from agent name
  const getAgentInitials = (name) => {
    if (!name) return 'A';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  // Fallback mock property data (used only if API fails)
  const getFallbackProperty = (propertyId) => ({
    id: propertyId,
    title: 'Sample Property',
    address: 'Singapore',
    price: 'Price on request',
    propertyType: 'Commercial',
    size: 'N/A',
    floors: 'N/A',
    yearBuilt: 'N/A',
    zoning: 'N/A',
    parkingSpaces: 'N/A',
    amenities: [],
    description: 'Property details are currently unavailable. Please try again later.',
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop',
    agent: {
      name: 'Property Agent',
      title: 'Licensed Real Estate Agent',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      phone: '+65 9123 4567'
    },
    location: {
      lat: 1.3521,
      lng: 103.8198,
      address: 'Singapore'
    }
  });

  // Fetch property from API
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        mapInitializedRef.current = false; // Reset map initialization flag
        const response = await propertiesAPI.getById(id);
        console.log('Fetched property:', response);
        
        // Transform the API response to match the expected format
        const transformedProperty = {
          id: response.id,
          title: response.title,
          address: response.address,
          price: formatPrice(response.asking_price, response.price_type),
          propertyType: response.property_type,
          size: `${response.size_sqft?.toLocaleString()} sq ft`,
          floors: response.floors?.toString(),
          yearBuilt: response.year_built?.toString(),
          zoning: response.zoning,
          parkingSpaces: response.parking_spaces?.toString(),
          description: response.description,
          image: response.images?.length > 0 ? response.images[0].url : getDefaultImage(response.property_type),
          amenities: response.amenities || [],
          agent: response.agent ? {
            name: response.agent.full_name,
            title: 'Licensed Real Estate Agent',
            image: response.agent.profile_image_url || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
            phone: response.agent.phone_number || '+65 9123 4567',
            email: response.agent.email
          } : {
            name: 'Property Agent',
            title: 'Licensed Real Estate Agent',
            image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
            phone: '+65 9123 4567'
          },
          location: {
            lat: parseFloat(response.latitude) || 1.3521,
            lng: parseFloat(response.longitude) || 103.8198,
            address: response.address
          }
        };
        
        // Handle multiple images
        if (response.images && response.images.length > 0) {
          const imageUrls = response.images.map(img => img.url);
          setImages(imageUrls);
        } else {
          // Use default image if no images provided
          const defaultImage = getDefaultImage(response.property_type);
          setImages([defaultImage]);
        }
        
        console.log('Property loaded successfully:', transformedProperty);
        console.log('Property coordinates:', transformedProperty.location);
        console.log('Property address for geocoding:', transformedProperty.location.address);
        console.log('Raw API response address:', response.address);
        console.log('Raw API response coordinates:', response.latitude, response.longitude);
        setProperty(transformedProperty);
      } catch (error) {
        console.error('Error fetching property:', error);
        // Fallback to generic property data if API fails
        setProperty(getFallbackProperty(id));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProperty();
    }
    
    // Cleanup function
    return () => {
      mapInitializedRef.current = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current = null;
      }
      if (placesServiceRef.current) {
        placesServiceRef.current = null;
      }
    };
  }, [id]);

  // Helper function to format price
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

  // Helper function to get default image based on property type
  const getDefaultImage = (propertyType) => {
    switch (propertyType?.toLowerCase()) {
      case 'office':
        return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop';
      case 'retail':
        return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop';
      case 'warehouse':
      case 'single-user factory':
      case 'multiple-user factory':
        return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop';
      case 'shop house':
        return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop';
      case 'business parks':
        return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop';
      default:
        return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop';
    }
  };

  // Image carousel navigation functions
  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const previousImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const selectImage = (index) => {
    setCurrentImageIndex(index);
  };

  // Keyboard navigation for carousel
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (images.length <= 1) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          previousImage();
          break;
        case 'ArrowRight':
          event.preventDefault();
          nextImage();
          break;
        case 'Home':
          event.preventDefault();
          setCurrentImageIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setCurrentImageIndex(images.length - 1);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [images.length]);

  // Initialize map when property is loaded
  useEffect(() => {
    if (property && !mapInitializedRef.current) {
      // Add a small delay to ensure the DOM is ready
      const timer = setTimeout(() => {
        loadGoogleMaps(GOOGLE_MAPS_API_KEY)
          .then(() => {
            // Always geocode the address to get the most accurate coordinates
            // This ensures the map shows the correct location regardless of what's stored in the database
            geocodeAddress(property.location.address)
              .then((coordinates) => {
                if (coordinates) {
                  // Always update the coordinates with the geocoded result
                  // This ensures the map shows the correct location
                  setProperty(prev => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      lat: coordinates.lat,
                      lng: coordinates.lng
                    }
                  }));
                  
                  // Initialize map with the accurate coordinates immediately
                  initializeMap(0, coordinates);
                } else {
                  // If geocoding fails, try with existing coordinates
                  initializeMap(0, { lat: property.location.lat, lng: property.location.lng });
                }
              })
              .catch((error) => {
                console.error('Geocoding failed:', error);
                // If geocoding fails, still try to initialize with existing coordinates
                // But first, try to use default Singapore coordinates if current ones are invalid
                if (!property.location.lat || !property.location.lng || 
                    property.location.lat === 0 || property.location.lng === 0) {
                  const fallbackCoords = { lat: 1.3521, lng: 103.8198 };
                  setProperty(prev => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      lat: fallbackCoords.lat,
                      lng: fallbackCoords.lng
                    }
                  }));
                  initializeMap(0, fallbackCoords);
                } else {
                  initializeMap(0, { lat: property.location.lat, lng: property.location.lng });
                }
              });
          })
          .catch((error) => {
            console.error('Failed to load Google Maps:', error);
            setAmenitiesError('Failed to load map. Please try again later.');
          });
      }, 100); // 100ms delay

      return () => clearTimeout(timer);
    }
  }, [property?.id]); // Only depend on property ID, not the entire property object

  // Refetch amenities when selected types change
  useEffect(() => {
    if (property && window.google && placesServiceRef.current) {
      fetchAmenities({ lat: property.location.lat, lng: property.location.lng });
    }
  }, [selectedAmenityTypes, property]);

  // Geocode address to get coordinates
  const geocodeAddress = (address) => {
    return new Promise((resolve, reject) => {
      if (!window.google || !window.google.maps) {
        reject(new Error('Google Maps not loaded'));
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      
      // Clean and normalize the address
      const cleanAddress = address ? address.trim() : '';
      if (!cleanAddress) {
        reject(new Error('No address provided'));
        return;
      }

      // Try multiple variations of the address for better results
      const addressVariations = [
        cleanAddress,
        `${cleanAddress}, Singapore`,
        cleanAddress.replace(/, Singapore$/, '') + ', Singapore',
        cleanAddress.replace(/, Singapore Singapore$/, ', Singapore'), // Handle double Singapore
        cleanAddress.replace(/Singapore Singapore/, 'Singapore'), // Handle double Singapore without comma
        cleanAddress.replace(/, Singapore Singapore Singapore$/, ', Singapore'), // Handle triple Singapore
        cleanAddress.replace(/Singapore Singapore Singapore/, 'Singapore'), // Handle triple Singapore without comma
        // Try without postal code
        cleanAddress.replace(/\s+\d{6}$/, ''), // Remove 6-digit postal code
        cleanAddress.replace(/\s+\d{6}$/, '') + ', Singapore', // Remove postal code and add Singapore
        // Try with just the street name
        cleanAddress.split(',')[0], // Just the street address part
        cleanAddress.split(',')[0] + ', Singapore', // Street address + Singapore
        // Try with different formatting
        cleanAddress.replace(/\s+/g, ' ').trim(), // Normalize spaces
        cleanAddress.replace(/\s+/g, ' ').trim() + ', Singapore' // Normalize spaces + Singapore
      ];

      // Remove duplicates
      const uniqueVariations = [...new Set(addressVariations)];

      let attempts = 0;
      const maxAttempts = uniqueVariations.length;

      const tryGeocode = (addressToTry) => {
        geocoder.geocode({ 
          address: addressToTry,
          componentRestrictions: { country: 'SG' } // Restrict to Singapore
        }, (results, status) => {
          attempts++;
          
          if (status === 'OK' && results && results.length > 0) {
            const location = results[0].geometry.location;
            const formattedAddress = results[0].formatted_address;
            resolve({
              lat: location.lat(),
              lng: location.lng(),
              formatted_address: formattedAddress
            });
          } else if (attempts < maxAttempts) {
            // Try next variation
            tryGeocode(uniqueVariations[attempts]);
            } else {
              // Try one final attempt without country restriction
              geocoder.geocode({ 
                address: cleanAddress
              }, (results, status) => {
                if (status === 'OK' && results && results.length > 0) {
                  const location = results[0].geometry.location;
                  const formattedAddress = results[0].formatted_address;
                  resolve({
                    lat: location.lat(),
                    lng: location.lng(),
                    formatted_address: formattedAddress
                  });
                } else {
                  reject(new Error(`Geocoding failed for all variations of: ${address}. Last status: ${status}`));
                }
              });
            }
        });
      };

      // Start with the first variation
      tryGeocode(uniqueVariations[0]);
    });
  };

  // Initialize Google Map
  const initializeMap = (retryCount = 0, customCoordinates = null) => {
    if (!window.google || !property) return;

    const mapElement = document.getElementById('property-listing-map');
    if (!mapElement) {
      console.error('Map element not found, retry count:', retryCount);
      if (retryCount < 3) {
        // Retry after a short delay
        setTimeout(() => initializeMap(retryCount + 1, customCoordinates), 500);
      } else {
        setAmenitiesError('Map container not found. Please refresh the page.');
      }
      return;
    }

    // Use custom coordinates if provided, otherwise use property coordinates
    const center = customCoordinates || { lat: property.location.lat, lng: property.location.lng };
    
    // Validate coordinates
    if (isNaN(center.lat) || isNaN(center.lng)) {
      console.error('Invalid coordinates:', center);
      setAmenitiesError('Invalid property location coordinates');
      return;
    }

    try {
      const map = new window.google.maps.Map(mapElement, {
        center: center,
        zoom: 16,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      mapInstanceRef.current = map;
      mapInitializedRef.current = true; // Mark map as initialized
      console.log('Map initialized successfully at:', center);

      // Add marker for the property
      const marker = new window.google.maps.Marker({
        position: center,
        map: map,
        title: property.title,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(32, 32)
        }
      });

      markerRef.current = marker;
      console.log('Marker added successfully');

      // Initialize Places service for amenities
      const placesService = new window.google.maps.places.PlacesService(map);
      placesServiceRef.current = placesService;

      // Load amenities for the property location
      fetchAmenities(center);
    } catch (error) {
      console.error('Error initializing map:', error);
      setAmenitiesError('Failed to initialize map. Please try again later.');
    }
  };

  // Fetch nearby amenities
  const fetchAmenities = async (location) => {
    if (!window.google || !placesServiceRef.current) {
      setAmenitiesError('Google Maps not loaded');
      return;
    }

    if (!location) {
      setAmenities([]);
      return;
    }

    setIsLoadingAmenities(true);
    setAmenitiesError('');

    try {
      const requests = selectedAmenityTypes.map(type => ({
        location: location,
        radius: 1000,
        type: type
      }));

      const results = await Promise.all(
        requests.map(request =>
          new Promise((resolve, reject) => {
            placesServiceRef.current.nearbySearch(request, (results, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                resolve(results || []);
              } else {
                resolve([]);
              }
            });
          })
        )
      );

      const allAmenities = results.flat().sort((a, b) => {
        const distanceA = window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(location),
          a.geometry.location
        );
        const distanceB = window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(location),
          b.geometry.location
        );
        return distanceA - distanceB;
      });

      // Remove duplicates and enrich with distance
      const uniqueAmenities = allAmenities.filter((amenity, index, self) =>
        index === self.findIndex(a => a.place_id === amenity.place_id)
      ).map(amenity => ({
        ...amenity,
        distance: window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(location),
          amenity.geometry.location
        )
      }));

      setAmenities(uniqueAmenities.slice(0, 20)); // Limit to 20 amenities
    } catch (error) {
      console.error('Error fetching amenities:', error);
      setAmenitiesError('Failed to load amenities');
    } finally {
      setIsLoadingAmenities(false);
    }
  };



  // Handle amenity type toggle
  const handleToggleAmenity = (type) => {
    setSelectedAmenityTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Amenity options - same as prediction.js
  const amenityOptions = [
    { type: 'school', label: 'Schools' },
    { type: 'hospital', label: 'Hospitals' },
    { type: 'supermarket', label: 'Supermarkets' },
    { type: 'restaurant', label: 'Restaurants' },
    { type: 'cafe', label: 'Cafes' },
    { type: 'bank', label: 'Banks' },
    { type: 'atm', label: 'ATMs' },
    { type: 'shopping_mall', label: 'Shopping Malls' },
    { type: 'bus_station', label: 'Bus Stations' },
    { type: 'subway_station', label: 'MRT' },
    { type: 'gym', label: 'Gyms' },
    { type: 'pharmacy', label: 'Pharmacies' }
  ];

  const handleContactAgent = () => {
    const message = `Hi ${property.agent.name}, I'm interested in the property at ${property.address}`;
    const whatsappUrl = `https://wa.me/${property.agent.phone.replace(/\s/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleBackToListings = () => {
    navigate('/dashboard/property-listings');
  };

  if (loading) {
    return (
      <div className="property-listing-loading">
        <div className="property-listing-loading-spinner"></div>
        <p>Loading property details...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <Header />
      
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="user-main-content">
          {/* Breadcrumbs */}
          <div className="property-listing-breadcrumbs">
            <button onClick={handleBackToListings} className="property-listing-back-button">
              Property Listings
            </button>
            <span className="property-listing-breadcrumb-separator">/</span>
            <span className="property-listing-breadcrumb-current">{property.address}</span>
          </div>

          {/* Property Header */}
          <div className="user-content-header">
            <h1 className="user-main-title">{property.title}</h1>
            <p className="property-listing-address">{property.address}</p>
            <div className="property-listing-price">{property.price}</div>
          </div>

          {/* Property Image Carousel */}
          <div className="property-listing-image-section">
            <div className="property-listing-image-carousel">
              {/* Main Image Display */}
              <div className="property-listing-main-image-container">
                <img 
                  src={images[currentImageIndex] || property.image} 
                  alt={`${property.title} - Image ${currentImageIndex + 1}`}
                  className="property-listing-main-image"
                />
                
                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button 
                      className="property-listing-carousel-btn property-listing-carousel-prev"
                      onClick={previousImage}
                      aria-label="Previous image"
                    >
                      ‹
                    </button>
                    <button 
                      className="property-listing-carousel-btn property-listing-carousel-next"
                      onClick={nextImage}
                      aria-label="Next image"
                    >
                      ›
                    </button>
                  </>
                )}
                
                {/* Image Counter */}
                {images.length > 1 && (
                  <div className="property-listing-image-counter">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </div>
              
              {/* Thumbnail Navigation */}
              {images.length > 1 && (
                <div className="property-listing-thumbnails">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      className={`property-listing-thumbnail ${index === currentImageIndex ? 'property-listing-thumbnail-active' : ''}`}
                      onClick={() => selectImage(index)}
                      aria-label={`Go to image ${index + 1}`}
                    >
                      <img 
                        src={image} 
                        alt={`${property.title} thumbnail ${index + 1}`}
                        className="property-listing-thumbnail-image"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Property Details Grid */}
          <div className="property-listing-details-grid">
            <div className="property-listing-summary-card">
              <h2 className="property-listing-section-title">Property Summary</h2>
              <div className="property-listing-summary-list">
                <div className="property-listing-summary-item">
                  <span className="property-listing-summary-label">Property Type:</span>
                  <span className="property-listing-summary-value">{property.propertyType}</span>
                </div>
                <div className="property-listing-summary-item">
                  <span className="property-listing-summary-label">Size:</span>
                  <span className="property-listing-summary-value">{property.size}</span>
                </div>
                <div className="property-listing-summary-item">
                  <span className="property-listing-summary-label">Number of Floors:</span>
                  <span className="property-listing-summary-value">{property.floors}</span>
                </div>
                <div className="property-listing-summary-item">
                  <span className="property-listing-summary-label">Year Built:</span>
                  <span className="property-listing-summary-value">{property.yearBuilt}</span>
                </div>
                <div className="property-listing-summary-item">
                  <span className="property-listing-summary-label">Zoning:</span>
                  <span className="property-listing-summary-value">{property.zoning}</span>
                </div>
                <div className="property-listing-summary-item">
                  <span className="property-listing-summary-label">Parking Spaces:</span>
                  <span className="property-listing-summary-value">{property.parkingSpaces}</span>
                </div>
              </div>
              
              {/* Amenities Section */}
              <div className="property-listing-amenities-section">
                <h3 className="property-listing-amenities-subtitle">Amenities</h3>
                <div className="property-listing-amenities-grid">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="property-listing-amenity-block">
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="property-listing-description">
            <h2 className="property-listing-section-title">Description</h2>
            <p className="property-listing-description-text">{property.description}</p>
          </div>

          {/* Location & Map */}
          <div className="property-listing-location">
            <h2 className="property-listing-section-title">Location & Amenities</h2>
            <div className="property-listing-map-container">
              <div id="property-listing-map" className="property-listing-map-container-inner"></div>
              
              {/* Nearby Amenities Panel */}
              <div className="property-listing-amenities-panel">
                <div className="property-listing-amenities-header">
                  <h3>Nearby Amenities</h3>
                  <div className="property-listing-amenity-filters">
                    {amenityOptions.map((opt) => (
                      <button 
                        key={opt.type}
                        type="button" 
                        className={`property-listing-amenity-chip ${selectedAmenityTypes.includes(opt.type) ? 'property-listing-active' : ''}`}
                        onClick={() => handleToggleAmenity(opt.type)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {isLoadingAmenities && (
                  <div className="property-listing-amenities-loading">Loading amenities…</div>
                )}
                {amenitiesError && (
                  <div className="property-listing-amenities-error">{amenitiesError}</div>
                )}

                {!isLoadingAmenities && !amenitiesError && amenities.length === 0 && (
                  <div className="property-listing-amenities-empty">No amenities found for the selected filters.</div>
                )}

                {!isLoadingAmenities && amenities.length > 0 && (
                  <ul className="property-listing-amenities-list">
                    {amenities.map((a) => (
                      <li className="property-listing-amenity-item" key={a.place_id}>
                        <div className="property-listing-amenity-main">
                          <div className="property-listing-amenity-name">{a.name}</div>
                          {a.vicinity && <div className="property-listing-amenity-address">{a.vicinity}</div>}
                        </div>
                        <div className="property-listing-amenity-meta">
                          {typeof a.rating === 'number' && (
                            <span className="property-listing-amenity-rating">★ {a.rating.toFixed(1)}</span>
                          )}
                          {typeof a.distance === 'number' && (
                            <span className="property-listing-amenity-distance">{Math.round(a.distance)} m</span>
                          )}
                          <a
                            className="property-listing-amenity-link"
                            href={`https://www.google.com/maps/place/?q=place_id:${a.place_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open in Maps
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Contact Agent */}
          <div className="property-listing-contact-agent-section">
            <h2 className="property-listing-section-title">Contact Agent</h2>
            <div className="property-listing-agent-card">
              <div className="property-listing-agent-info">
                <div className="property-listing-agent-initials">
                  {getAgentInitials(property.agent.name)}
                </div>
                <div className="property-listing-agent-details">
                  <h3 className="property-listing-agent-name">{property.agent.name}</h3>
                  <p className="property-listing-agent-title">{property.agent.title}</p>
                  {property.agent.phone && (
                    <p className="property-listing-agent-phone">📞 {property.agent.phone}</p>
                  )}
                  {property.agent.email && (
                    <p className="property-listing-agent-email">✉️ {property.agent.email}</p>
                  )}
                </div>
              </div>
              <div className="property-listing-agent-actions">
                {property.agent.phone && (
                  <button 
                    onClick={() => window.open(`tel:${property.agent.phone}`, '_self')}
                    className="property-listing-contact-agent-btn property-listing-call-btn"
                  >
                    <span className="property-listing-phone-icon">📞</span>
                    Call Agent
                  </button>
                )}
                {property.agent.email && (
                  <button 
                    onClick={() => window.open(`mailto:${property.agent.email}?subject=Inquiry about ${property.title}`, '_self')}
                    className="property-listing-contact-agent-btn property-listing-email-btn"
                  >
                    <span className="property-listing-email-icon">✉️</span>
                    Email Agent
                  </button>
                )}
                <button 
                  onClick={handleContactAgent}
                  className="property-listing-contact-agent-btn"
                >
                  <span className="property-listing-whatsapp-icon">📱</span>
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default PropertyListing;
