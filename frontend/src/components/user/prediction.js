import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GOOGLE_MAPS_API_KEY } from '../../config/maps';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import PropertyCard from './PropertyCard';
import { bookmarksAPI, predictionAPI, propertyCardAPI } from '../../services/api';
import './prediction.css';

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

const AMENITY_OPTIONS = [
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
  { type: 'pharmacy', label: 'Pharmacies' },
];

const Prediction = () => {
  const [activeTab, setActiveTab] = useState('price-prediction');
  const [activeMapTab, setActiveMapTab] = useState('street');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAmenityTypes, setSelectedAmenityTypes] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [isLoadingAmenities, setIsLoadingAmenities] = useState(false);
  const [amenitiesError, setAmenitiesError] = useState('');
  const [isAddressBookmarked, setIsAddressBookmarked] = useState(false);
  const [isPredictionBookmarked, setIsPredictionBookmarked] = useState(false);
  const [mlPredictionData, setMlPredictionData] = useState(null);
  const [isLoadingMlPrediction, setIsLoadingMlPrediction] = useState(false);
  const [mlPredictionError, setMlPredictionError] = useState('');
  const [propertyCardData, setPropertyCardData] = useState({ nearbyProperties: [], regionAgents: [] });
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get search data from navigation state or use default
  const searchData = location.state?.searchData || {
    address: '123 Main Street, Singapore',
    propertyType: 'Industrial Property',
    floorArea: '1,500',
    level: 'Ground Floor',
    unit: 'A1'
  };



  // Check if the address was originally a postal code
  const isPostalCodeSearch = /^\d{6}$/.test(searchData.address.split(',')[0].trim());

  // Call ML prediction API when component loads
  useEffect(() => {
    const generateMlPrediction = async () => {
      if (!searchData.address || !searchData.propertyType || !searchData.floorArea) {
        return;
      }

      setIsLoadingMlPrediction(true);
      setMlPredictionError('');

      try {
        // Prepare property data for ML prediction
        const propertyData = {
          propertyType: searchData.propertyType,
          address: searchData.address,
          floorArea: searchData.floorArea,
          level: searchData.level || 'Ground Floor',
          unit: searchData.unit || 'N/A'
        };

        // Check if user is authenticated
        const token = localStorage.getItem('accessToken');
        const useTestEndpoint = !token;

        // Call the appropriate ML prediction API
        const response = useTestEndpoint 
          ? await predictionAPI.predictPriceTest(propertyData)
          : await predictionAPI.predictPrice(propertyData);

        if (response.success) {
          setMlPredictionData({
            property_data: response.property_data,
            comparison_data: response.comparison_data,
            matched_address: response.matched_address
          });
        } else {
          setMlPredictionError('Failed to generate ML prediction');
        }
      } catch (error) {
        console.error('ML prediction error:', error);
        
        // Check if it's a prediction limit error
        if (error.response && error.response.data) {
          const errorData = error.response.data;
          if (errorData.error === 'prediction_limit_reached' || errorData.upgrade_required) {
            setMlPredictionError(`limit_reached:${errorData.message || 'You have reached your free prediction limit.'}`);
            // Show upgrade prompt
            const upgradeConfirmed = window.confirm(
              `${errorData.message || 'You have reached your free prediction limit (3 searches).'}\n\n` +
              `Would you like to upgrade to Premium for unlimited predictions?`
            );
            if (upgradeConfirmed) {
              navigate('/profile', { state: { showSubscriptionModal: true } });
            }
            return;
          }
        }
        
        if (error.message.includes('Invalid token') || error.message.includes('Token expired')) {
          setMlPredictionError('Please log in to get AI-powered predictions');
        } else if (error.message.includes('Authorization token required')) {
          setMlPredictionError('Please log in to get AI-powered predictions');
        } else {
          setMlPredictionError('AI prediction temporarily unavailable: ' + (error.message || 'Unknown error'));
        }
      } finally {
        setIsLoadingMlPrediction(false);
      }
    };

    generateMlPrediction();
  }, [searchData.address, searchData.propertyType, searchData.floorArea]);

  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const placesServiceRef = useRef(null);
  const lastLocationRef = useRef(null);

  // Get user type from localStorage
  const userType = localStorage.getItem('userType') || 'free';

  // Generate dynamic similar properties based on search data
  const generateSimilarProperties = () => {
    const baseAddress = searchData.address.split(',')[0]; // Get street name
    const propertyType = searchData.propertyType;
    const baseSize = parseInt(searchData.floorArea.replace(/,/g, ''));
    
    return [
      {
        id: 1,
        address: `${baseAddress.replace(/\d+/, '456')} Oak Avenue, Singapore`,
        propertyType: propertyType,
        size: `${baseSize + 200} sq ft`,
        transactionDate: '2023-10-01',
        transactionPrice: '$2.7M'
      },
      {
        id: 2,
        address: `${baseAddress.replace(/\d+/, '789')} Pine Lane, Singapore`,
        propertyType: propertyType,
        size: `${baseSize - 300} sq ft`,
        transactionDate: '2023-09-15',
        transactionPrice: '$2.3M'
      },
      {
        id: 3,
        address: `${baseAddress.replace(/\d+/, '321')} Elm Street, Singapore`,
        propertyType: propertyType,
        size: `${baseSize + 300} sq ft`,
        transactionDate: '2023-08-20',
        transactionPrice: '$3.1M'
      },
      {
        id: 4,
        address: `${baseAddress.replace(/\d+/, '654')} Maple Road, Singapore`,
        propertyType: propertyType,
        size: `${baseSize - 200} sq ft`,
        transactionDate: '2023-07-10',
        transactionPrice: '$2.5M'
      },
      {
        id: 5,
        address: `${baseAddress.replace(/\d+/, '987')} Cedar Way, Singapore`,
        propertyType: propertyType,
        size: `${baseSize + 100} sq ft`,
        transactionDate: '2023-06-05',
        transactionPrice: '$2.9M'
      }
    ];
  };

  const similarProperties = generateSimilarProperties();

  // Generate dynamic property listings based on search data
  const generatePropertyListings = () => {
    const baseAddress = searchData.address.split(',')[0];
    const propertyType = searchData.propertyType;
    const baseSize = parseInt(searchData.floorArea.replace(/,/g, ''));
    
    return [
      {
        id: 1,
        address: baseAddress,
        propertyType: propertyType,
        size: `${searchData.floorArea} sq ft`,
        price: '$2.5M - $2.8M',
        image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&h=80&fit=crop'
      },
      {
        id: 2,
        address: `${baseAddress.replace(/\d+/, '456')} Industrial Park`,
        propertyType: propertyType,
        size: `${baseSize + 500} sq ft`,
        price: '$3.2M - $3.5M',
        image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=80&fit=crop'
      },
      {
        id: 3,
        address: `${baseAddress.replace(/\d+/, '789')} Business Center`,
        propertyType: propertyType,
        size: `${baseSize + 300} sq ft`,
        price: '$2.8M - $3.1M',
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=100&h=80&fit=crop'
      }
    ];
  };

  const propertyListings = generatePropertyListings();

  const agents = [
    {
      id: 1,
      name: 'Ethan Tan',
      role: 'Senior Specialist',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face'
    },
    {
      id: 2,
      name: 'Darrel Lee',
      role: 'Associate Partner',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face'
    }
  ];

  // Create prediction data structure for PropertyCard
  const predictionData = {
    estimatedSalesPrice: '$2.5M - $2.8M',
    estimatedRentalPrice: '$8K - $12K/month',
    propertyType: searchData.propertyType,
    floorArea: searchData.floorArea,
    tenure: '99 years',
    ceilingHeight: '3.5 meters',
    floorLoading: '10 kN/sq m',
    powerSupply: '200 amps',
    features: 'Loading bay, sprinkler system, 24-hour access',
    marketTrend: '+5%',
    marketTrendPeriod: 'Last 12 months (YoY)',
    medianSalePrice: '$2.8M',
    highestSoldPrice: '$3.1M (Industrial Property with 1,800 sq ft, 2023-09-10)',
    historicalTransactions: similarProperties.map(prop => ({
      address: prop.address,
      type: prop.propertyType,
      area: prop.size,
      date: prop.transactionDate,
      price: prop.transactionPrice
    })),
    activeListings: propertyListings.map(listing => ({
      address: listing.address,
      type: listing.propertyType,
      area: listing.size,
      price: listing.price
    })),
    agents: agents.map(agent => ({
      name: agent.name,
      title: agent.role,
      image: agent.image
    }))
  };

  // Initialize Google Maps
  useEffect(() => {
    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then((google) => {
        // Initialize the map using the new function
        initializeMap('prediction-map', searchData.address);
        
        // Set up places service for amenities - wait for map to be initialized
        setTimeout(() => {
          const mapDiv = document.getElementById('prediction-map');
          if (mapDiv && mapInstanceRef.current) {
            placesServiceRef.current = new google.maps.places.PlacesService(mapInstanceRef.current);
            
            // Now that PlacesService is ready, fetch amenities if we have a location
            if (lastLocationRef.current) {
              fetchAmenities(lastLocationRef.current, selectedAmenityTypes);
            }
          }
        }, 1000); // Wait 1 second for map to fully initialize
      })
      .catch((err) => {
        console.error('Error loading Google Maps:', err);
      });
  }, [searchData.address]);

  // Check if current address is already bookmarked
  useEffect(() => {
    const checkBookmarks = async () => {
      try {
        const bookmarks = await bookmarksAPI.getAll();
        const addressBookmarked = bookmarks.bookmarked_addresses.some(b => b.address === searchData.address);
        const predictionBookmarked = bookmarks.bookmarked_predictions.some(b => b.address === searchData.address);
        
        setIsAddressBookmarked(addressBookmarked);
        setIsPredictionBookmarked(predictionBookmarked);
      } catch (error) {
        console.error('Error checking bookmarks:', error);
      }
    };

    checkBookmarks();
  }, [searchData.address]);



  const nearbySearchOnce = (location, type) => {
    return new Promise((resolve) => {
      if (!placesServiceRef.current) {
        resolve([]);
        return;
      }
      
      placesServiceRef.current.nearbySearch(
        { location, radius: SEARCH_RADIUS_METERS, type },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results.slice(0, 10));
          } else {
            resolve([]);
          }
        }
      );
    });
  };

  const fetchAmenities = async (latLng, typesOverride) => {
    const activeTypes = Array.isArray(typesOverride) ? typesOverride : selectedAmenityTypes;
    
    // If PlacesService is not ready, retry after a delay
    if (!placesServiceRef.current) {
      setTimeout(() => {
        if (lastLocationRef.current) {
          fetchAmenities(lastLocationRef.current, activeTypes);
        }
      }, 2000);
      return;
    }
    
    try {
      setIsLoadingAmenities(true);
      setAmenitiesError('');
      
      const promises = activeTypes.map((t) => nearbySearchOnce(latLng, t));
      const results = await Promise.all(promises);
      const flat = results.flat();
      
      // Deduplicate by place_id
      const uniqueMap = new Map();
      for (const r of flat) {
        if (!uniqueMap.has(r.place_id)) uniqueMap.set(r.place_id, r);
      }
      
      // Enrich with distance and primary type label
      const google = window.google;
      const enriched = Array.from(uniqueMap.values()).map((p) => {
        const distance = google && google.maps.geometry
          ? google.maps.geometry.spherical.computeDistanceBetween(latLng, p.geometry.location)
          : null;
        return {
          id: p.place_id,
          name: p.name,
          vicinity: p.vicinity,
          rating: p.rating,
          userRatingsTotal: p.user_ratings_total,
          types: p.types,
          location: p.geometry && p.geometry.location,
          distance,
        };
      });
      
      // Sort by distance
      enriched.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      
      setAmenities(enriched);
    } catch (e) {
      console.error('Error fetching amenities:', e);
      setAmenitiesError('Failed to load nearby amenities.');
    } finally {
      setIsLoadingAmenities(false);
    }
  };

  const toggleAmenity = (type) => {
    setSelectedAmenityTypes((prev) => {
      const next = prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type];
      if (lastLocationRef.current) {
        // Use the new selection immediately
        fetchAmenities(lastLocationRef.current, next);
      }
      return next;
    });
  };

  const initializeMap = (mapId, address) => {
    const mapDiv = document.getElementById(mapId);
    if (!mapDiv || !window.google) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: address || 'Singapore' }, (results, status) => {
      let center = DEFAULT_CENTER;
      if (status === 'OK' && results[0]) {
        center = results[0].geometry.location;
      }
      
      const map = new window.google.maps.Map(mapDiv, {
        center: center,
        zoom: 16,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      // Add marker for the property
      new window.google.maps.Marker({
        position: center,
        map: map,
        title: address
      });

      // Store reference for this property
      mapInstanceRef.current = map;
      lastLocationRef.current = center;
    });
  };

  const handleMapTabChange = (tab) => {
    setActiveMapTab(tab);
    
    // Handle map changes for the property
    handlePropertyMapChange('prediction-map', tab, searchData.address);
  };

  const handlePropertyMapChange = (mapId, tab, address) => {
    const mapDiv = document.getElementById(mapId);
    if (!mapDiv) return;
    
    if (tab === 'onemap') {
      // Load OneMap with reverse geocoding API
      const lat = lastLocationRef.current?.lat() || 1.2868108;
      const lng = lastLocationRef.current?.lng() || 103.8545349;
      const oneMapUrl = `https://www.onemap.gov.sg/amm/amm.html?mapStyle=Default&zoomLevel=16&lat=${lat}&lng=${lng}&returnVal=true&pin=true&marker=true&showMarker=true&centerOnSearch=true&searchType=address&showSearchResults=true&highlight=true&autoSearch=true`;
      mapDiv.innerHTML = `<iframe src="${oneMapUrl}" width="100%" height="100%" frameborder="0" style="border:0;" allowfullscreen="" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation allow-modals" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
    } else if (tab === 'ura') {
      // Load URA Masterplan Map with planning area API
      const lat = lastLocationRef.current?.lat() || 1.2868108;
      const lng = lastLocationRef.current?.lng() || 103.8545349;
      const uraUrl = `https://www.ura.gov.sg/maps/?service=mp&lat=${lat}&lng=${lng}&zoom=16&marker=true&popup=true&showMarker=true&highlight=true&autoCenter=true&planningArea=true`;
      mapDiv.innerHTML = `<iframe src="${uraUrl}" width="100%" height="100%" frameborder="0" style="border:0;" allowfullscreen="" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation allow-modals" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
    } else {
      // Load Google Maps (Street Map) - Now with built-in Map/Satellite controls
      if (window.google) {
        // Re-initialize Google Map
        initializeMap(mapId, address);
      }
    }
  };

  const handleDownloadReport = async (e) => {
    // Prevent any navigation or event bubbling
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Check if user is free - show upgrade message
    const userType = localStorage.getItem('userType') || 'free';
    if (userType.toLowerCase() === 'free') {
      alert('Report download is not available for free users. Please upgrade to Premium to download reports.');
      return;
    }
    
    try {
      // Prepare data for Excel export
      const exportData = {
        property: searchData,
        comparisonData: predictionData,
        mlPredictionData: mlPredictionData,
        nearbyProperties: propertyCardData.nearbyProperties || [],
        regionAgents: propertyCardData.regionAgents || []
      };
      
      await propertyCardAPI.exportExcel(exportData);
    } catch (error) {
      console.error('Error downloading report:', error);
      const errorMessage = error.message || 'Failed to download report. Please try again.';
      if (errorMessage.includes('upgrade') || errorMessage.includes('free users')) {
        alert(errorMessage);
      } else {
        alert('Failed to download report. Please try again.');
      }
    }
  };

  const handlePropertyCardDataUpdate = useCallback((data) => {
    setPropertyCardData(data);
  }, []); // Empty deps - we only want to update state, not recreate the function

  const handleBookmarkAddress = async () => {
    try {
      if (!isAddressBookmarked) {
        // Create bookmark
        await bookmarksAPI.create({
          bookmark_type: 'property',
          address: searchData.address,
          floor_area: parseFloat(searchData.floorArea.replace(/,/g, '')),
          level: searchData.level || 'N/A',
          unit_number: searchData.unit || 'N/A',
          property_type: searchData.propertyType
        });
        setIsAddressBookmarked(true);
      } else {
        // Find and delete bookmark
        const bookmarks = await bookmarksAPI.getAll();
        const bookmark = bookmarks.bookmarked_addresses.find(b => b.address === searchData.address);
        if (bookmark) {
          await bookmarksAPI.delete(bookmark.id);
        }
        setIsAddressBookmarked(false);
      }
    } catch (error) {
      console.error('Error handling address bookmark:', error);
      // Revert state on error
      setIsAddressBookmarked(!isAddressBookmarked);
    }
  };

  const handleBookmarkPrediction = async () => {
    try {
      if (!isPredictionBookmarked) {
        // Create bookmark
        await bookmarksAPI.create({
          bookmark_type: 'prediction',
          address: searchData.address,
          floor_area: parseFloat(searchData.floorArea.replace(/,/g, '')),
          level: searchData.level || 'N/A',
          unit_number: searchData.unit || 'N/A',
          property_type: searchData.propertyType
        });
        setIsPredictionBookmarked(true);
      } else {
        // Find and delete bookmark
        const bookmarks = await bookmarksAPI.getAll();
        const bookmark = bookmarks.bookmarked_predictions.find(b => b.address === searchData.address);
        if (bookmark) {
          await bookmarksAPI.delete(bookmark.id);
        }
        setIsPredictionBookmarked(false);
      }
    } catch (error) {
      console.error('Error handling prediction bookmark:', error);
      // Revert state on error
      setIsPredictionBookmarked(!isPredictionBookmarked);
    }
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
          <div className="prediction-content-header">
            <h1 className="prediction-main-title">Prediction for {searchData.address}</h1>
            {isPostalCodeSearch && (
              <div className="prediction-postal-code-info">
                <small>📍 Address found from postal code search</small>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="prediction-action-buttons">
            <button 
              className={`prediction-action-btn prediction-bookmark-btn ${isAddressBookmarked ? 'active' : ''}`}
              onClick={handleBookmarkAddress}
              title={isAddressBookmarked ? 'Remove from bookmarks' : 'Bookmark address'}
            >
              <span className="prediction-btn-icon">🔖</span>
              {isAddressBookmarked ? 'Bookmarked' : 'Bookmark Address'}
            </button>
            <button 
              className={`prediction-action-btn prediction-bookmark-btn ${isPredictionBookmarked ? 'active' : ''}`}
              onClick={handleBookmarkPrediction}
              title={isPredictionBookmarked ? 'Remove prediction from bookmarks' : 'Bookmark prediction'}
            >
              <span className="prediction-btn-icon">🔖</span>
              {isPredictionBookmarked ? 'Prediction Saved' : 'Bookmark Prediction'}
            </button>
            {(() => {
              const userType = localStorage.getItem('userType') || 'free';
              const isFreeUser = userType.toLowerCase() === 'free';
              
              if (isFreeUser) {
                return null; // Hide download button for free users
              }
              
              return (
                <button 
                  className="prediction-action-btn prediction-download-btn"
                  onClick={handleDownloadReport}
                  title="Download prediction report"
                >
                  <span className="prediction-btn-icon">📥</span>
                  Download Report
                </button>
              );
            })()}
          </div>
          
          {/* Property Card with all details */}
          <PropertyCard
            property={searchData}
            comparisonData={predictionData}
            activeMapTab={activeMapTab}
            onMapTabChange={handleMapTabChange}
            mapId="prediction-map"
            // ML prediction data
            mlPredictionData={mlPredictionData}
            // Amenities props
            amenities={amenities}
            selectedAmenityTypes={selectedAmenityTypes}
            onToggleAmenity={toggleAmenity}
            isLoadingAmenities={isLoadingAmenities}
            amenitiesError={amenitiesError}
            amenityOptions={AMENITY_OPTIONS}
            // Data callback for export
            onDataUpdate={handlePropertyCardDataUpdate}
          />
          

          


        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Prediction;
