import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GOOGLE_MAPS_API_KEY } from '../../config/maps';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import PropertyCard from './PropertyCard';
import { bookmarksAPI, predictionAPI, propertyCardAPI } from '../../services/api';
import './comparison.css';

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

const Comparison = () => {
  const [activeTab, setActiveTab] = useState('compare-predictions');
  const [activeMapTab, setActiveMapTab] = useState('onemap');
  
  // Separate amenities state for each property
  const [property1Amenities, setProperty1Amenities] = useState([]);
  const [property1SelectedTypes, setProperty1SelectedTypes] = useState([]);
  const [property1LoadingAmenities, setProperty1LoadingAmenities] = useState(false);
  const [property1AmenitiesError, setProperty1AmenitiesError] = useState('');
  
  const [property2Amenities, setProperty2Amenities] = useState([]);
  const [property2SelectedTypes, setProperty2SelectedTypes] = useState([]);
  const [property2LoadingAmenities, setProperty2LoadingAmenities] = useState(false);
  const [property2AmenitiesError, setProperty2AmenitiesError] = useState('');
  const [isComparisonBookmarked, setIsComparisonBookmarked] = useState(false);
  const [isPropertyBookmarked, setIsPropertyBookmarked] = useState(false);
  
  // ML prediction data for both properties
  const [property1MlData, setProperty1MlData] = useState(null);
  const [property2MlData, setProperty2MlData] = useState(null);
  const [isLoadingMlPredictions, setIsLoadingMlPredictions] = useState(false);
  const [mlPredictionError, setMlPredictionError] = useState('');
  const [property1CardData, setProperty1CardData] = useState({ nearbyProperties: [], regionAgents: [] });
  const [property2CardData, setProperty2CardData] = useState({ nearbyProperties: [], regionAgents: [] });
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const lastLocationRef = useRef(null);
  const property1LocationRef = useRef(null);
  const property2LocationRef = useRef(null);
  
  // Get comparison data from navigation state
  const properties = location.state?.properties || [
    {
      id: 1,
      propertyType: 'Warehouse',
      address: '123 Main Street, Singapore',
      floorArea: '10,000',
      level: 'Ground Floor',
      unit: 'A1'
    },
    {
      id: 2,
      propertyType: 'Warehouse',
      address: '123 Main Street, Singapore',
      floorArea: '10,000',
      level: 'Ground Floor',
      unit: 'A1'
    }
  ];

  // Generate ML predictions for both properties
  useEffect(() => {
    const generateMlPredictions = async () => {
      if (!properties[0] || !properties[1]) return;

      setIsLoadingMlPredictions(true);
      setMlPredictionError('');

      try {
        // Check if user is authenticated
        const token = localStorage.getItem('accessToken');
        const useTestEndpoint = !token;

        // Generate predictions for both properties in parallel
        const [property1Response, property2Response] = await Promise.allSettled([
          // Property 1 prediction
          (useTestEndpoint ? predictionAPI.predictPriceTest : predictionAPI.predictPrice)({
            propertyType: properties[0].propertyType,
            address: properties[0].address,
            floorArea: properties[0].floorArea,
            level: properties[0].level || 'Ground Floor',
            unit: properties[0].unit || 'N/A'
          }),
          // Property 2 prediction
          (useTestEndpoint ? predictionAPI.predictPriceTest : predictionAPI.predictPrice)({
            propertyType: properties[1].propertyType,
            address: properties[1].address,
            floorArea: properties[1].floorArea,
            level: properties[1].level || 'Ground Floor',
            unit: properties[1].unit || 'N/A'
          })
        ]);

        // Handle Property 1 response
        if (property1Response.status === 'fulfilled' && property1Response.value.success) {
          setProperty1MlData({
            property_data: property1Response.value.property_data,
            comparison_data: property1Response.value.comparison_data,
            matched_address: property1Response.value.matched_address
          });
        }

        // Handle Property 2 response
        if (property2Response.status === 'fulfilled' && property2Response.value.success) {
          setProperty2MlData({
            property_data: property2Response.value.property_data,
            comparison_data: property2Response.value.comparison_data,
            matched_address: property2Response.value.matched_address
          });
        }

        // Check for errors
        if (property1Response.status === 'rejected' || property2Response.status === 'rejected') {
          setMlPredictionError('Some predictions failed to generate');
        }

      } catch (error) {
        console.error('ML prediction error:', error);
        setMlPredictionError('AI predictions temporarily unavailable');
      } finally {
        setIsLoadingMlPredictions(false);
      }
    };

    generateMlPredictions();
  }, [properties]);

  // Mock detailed comparison data
  const comparisonData = {
    property1: {
      ...properties[0],
      estimatedSalesPrice: '$3,500,000 - $4,000,000',
      estimatedRentalPrice: '$3,500 - $4,000 / month',
      tenure: '60-year Leasehold (starting 2015)',
      ceilingHeight: '10 meters',
      floorLoading: '15 kN/sq m',
      powerSupply: '500 amps',
      features: '3 loading bays, sprinkler system',
      marketTrend: '+5%',
      marketTrendPeriod: 'Last 6 Months +5%',
      medianSalePrice: '$3,750,000',
      highestSoldPrice: '$4,500,000 (Warehouse with 12m ceiling height, 2023-05-10)',
      location: 'Jurong Island',
      historicalTransactions: [
        { address: '20 Tuas South Avenue', type: 'Warehouse', area: '10,500 sq ft', date: '2023-08-15', price: '$3,800,000' },
        { address: '25 Tuas South Avenue', type: 'Warehouse', area: '9,800 sq ft', date: '2023-07-20', price: '$3,600,000' },
        { address: '10 Tuas South Avenue', type: 'Warehouse', area: '11,000 sq ft', date: '2023-06-25', price: '$4,200,000' }
      ],
      activeListings: [
        { address: '18 Tuas South Avenue', type: 'Warehouse', area: '11,500 sq ft', price: '$4,100,000' },
        { address: '22 Tuas South Avenue', type: 'Warehouse', area: '9,500 sq ft', price: '$3,900,000' }
      ],
      agents: [
        { name: 'Sophia Clark', title: 'Agent at Industrial Realty Group', image: '👩‍💼' },
        { name: 'Ethan Wong', title: 'Agent at Premier Industrial Properties', image: '👨‍💼' }
      ]
    },
    property2: {
      ...properties[1],
      estimatedSalesPrice: '$2,000,000 - $2,500,000',
      estimatedRentalPrice: '$4,000 - $4,500 / month',
      tenure: '60-year Leasehold (starting 2015)',
      ceilingHeight: '10 meters',
      floorLoading: '15 kN/sq m',
      powerSupply: '500 amps',
      features: '3 loading bays, sprinkler system',
      marketTrend: '+7%',
      marketTrendPeriod: 'Last 6 Months +7%',
      medianSalePrice: '$2,250,000',
      highestSoldPrice: '$2,800,000 (Factory with 24-hour access, 2023-06-20)',
      location: 'Johor Bahru',
      historicalTransactions: [
        { address: '35 Woodlands Industrial Park E1', type: 'Factory', area: '7,800 sq ft', date: '2023-09-05', price: '$2,300,000' },
        { address: '28 Woodlands Industrial Park E1', type: 'Factory', area: '7,200 sq ft', date: '2023-08-10', price: '$2,100,000' },
        { address: '32 Woodlands Industrial Park E1', type: 'Factory', area: '8,000 sq ft', date: '2023-07-15', price: '$2,450,000' }
      ],
      activeListings: [
        { address: '25 Woodlands Industrial Park E1', type: 'Factory', area: '8,500 sq ft', price: '$2,600,000' },
        { address: '38 Woodlands Industrial Park E1', type: 'Factory', area: '7,000 sq ft', price: '$2,200,000' }
      ],
      agents: [
        { name: 'Olivia Bennett', title: 'Agent at Industrial Realty Group', image: '👩‍💼' },
        { name: 'Ryan Tan', title: 'Agent at Premier Industrial Properties', image: '👨‍💼' }
      ]
    }
  };

  // Initialize maps when component mounts
  useEffect(() => {
    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then((google) => {
        // Initialize maps for both properties
        initializeMap('property1-map', properties[0]?.address);
        initializeMap('property2-map', properties[1]?.address);
      })
      .catch((err) => {
        console.error('Error loading Google Maps:', err);
      });
  }, [properties]);

  // Check if current comparison is already bookmarked
  useEffect(() => {
    const checkBookmarks = async () => {
      try {
        const bookmarks = await bookmarksAPI.getAll();
        const comparisonBookmarked = bookmarks.bookmarked_comparisons.some(b => 
          b.address === properties[0]?.address && b.address_2 === properties[1]?.address
        );
        const propertyBookmarked = bookmarks.bookmarked_addresses.some(b => 
          b.address === properties[0]?.address
        ) && bookmarks.bookmarked_addresses.some(b => 
          b.address === properties[1]?.address
        );
        
        setIsComparisonBookmarked(comparisonBookmarked);
        setIsPropertyBookmarked(propertyBookmarked);
      } catch (error) {
        console.error('Error checking bookmarks:', error);
      }
    };

    checkBookmarks();
  }, [properties]);

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
      if (mapId === 'property1-map') {
        mapInstanceRef.current = map;
        lastLocationRef.current = center;
        property1LocationRef.current = center;
      } else if (mapId === 'property2-map') {
        property2LocationRef.current = center;
      }
    });
  };

  const handleMapTabChange = (tab) => {
    setActiveMapTab(tab);
    
    // Handle map changes for both properties
    handlePropertyMapChange('property1-map', tab, properties[0]?.address);
    handlePropertyMapChange('property2-map', tab, properties[1]?.address);
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
      // Prepare data for Excel export - comparison mode with both properties
      const exportData = {
        isComparison: true,
        property1: {
          property: properties[0],
          comparisonData: comparisonData.property1,
          mlPredictionData: property1MlData,
          nearbyProperties: property1CardData.nearbyProperties || [],
          regionAgents: property1CardData.regionAgents || []
        },
        property2: {
          property: properties[1],
          comparisonData: comparisonData.property2,
          mlPredictionData: property2MlData,
          nearbyProperties: property2CardData.nearbyProperties || [],
          regionAgents: property2CardData.regionAgents || []
        }
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

  const handleProperty1CardDataUpdate = useCallback((data) => {
    setProperty1CardData(data);
  }, []); // Empty deps - we only want to update state, not recreate the function

  const handleProperty2CardDataUpdate = useCallback((data) => {
    setProperty2CardData(data);
  }, []); // Empty deps - we only want to update state, not recreate the function

  const handleBookmarkComparison = async () => {
    try {
      if (!isComparisonBookmarked) {
        // Create comparison bookmark with both properties
        await bookmarksAPI.create({
          bookmark_type: 'comparison',
          address: properties[0].address,
          floor_area: parseFloat(properties[0].floorArea.replace(/,/g, '')),
          level: properties[0].level || 'N/A',
          unit_number: properties[0].unit || 'N/A',
          property_type: properties[0].propertyType,
          address_2: properties[1].address,
          floor_area_2: parseFloat(properties[1].floorArea.replace(/,/g, '')),
          level_2: properties[1].level || 'N/A',
          unit_number_2: properties[1].unit || 'N/A',
          property_type_2: properties[1].propertyType
        });
        setIsComparisonBookmarked(true);
      } else {
        // Find and delete bookmark
        const bookmarks = await bookmarksAPI.getAll();
        const bookmark = bookmarks.bookmarked_comparisons.find(b => 
          b.address === properties[0].address && b.address_2 === properties[1].address
        );
        if (bookmark) {
          await bookmarksAPI.delete(bookmark.id);
        }
        setIsComparisonBookmarked(false);
      }
    } catch (error) {
      console.error('Error handling comparison bookmark:', error);
      // Revert state on error
      setIsComparisonBookmarked(!isComparisonBookmarked);
    }
  };

  const handleBookmarkAddress = async () => {
    try {
      if (!isPropertyBookmarked) {
        // Create property bookmarks for both properties
        await bookmarksAPI.create({
          bookmark_type: 'property',
          address: properties[0].address,
          floor_area: parseFloat(properties[0].floorArea.replace(/,/g, '')),
          level: properties[0].level || 'N/A',
          unit_number: properties[0].unit || 'N/A',
          property_type: properties[0].propertyType
        });
        
        // Create second bookmark for the second property
        await bookmarksAPI.create({
          bookmark_type: 'property',
          address: properties[1].address,
          floor_area: parseFloat(properties[1].floorArea.replace(/,/g, '')),
          level: properties[1].level || 'N/A',
          unit_number: properties[1].unit || 'N/A',
          property_type: properties[1].propertyType
        });
        
        setIsPropertyBookmarked(true);
      } else {
        // Find and delete both bookmarks
        const bookmarks = await bookmarksAPI.getAll();
        const bookmark1 = bookmarks.bookmarked_addresses.find(b => b.address === properties[0].address);
        const bookmark2 = bookmarks.bookmarked_addresses.find(b => b.address === properties[1].address);
        
        if (bookmark1) {
          await bookmarksAPI.delete(bookmark1.id);
        }
        if (bookmark2) {
          await bookmarksAPI.delete(bookmark2.id);
        }
        
        setIsPropertyBookmarked(false);
      }
    } catch (error) {
      console.error('Error handling address bookmark:', error);
      // Revert state on error
      setIsPropertyBookmarked(!isPropertyBookmarked);
    }
  };

  // Amenities functionality for Property 1
  const toggleProperty1Amenity = (amenityType) => {
    setProperty1SelectedTypes(prev => {
      if (prev.includes(amenityType)) {
        return prev.filter(type => type !== amenityType);
      } else {
        return [...prev, amenityType];
      }
    });
  };

  const searchProperty1Amenities = async (location) => {
    if (!window.google || !window.google.maps) {
      setProperty1AmenitiesError('Google Maps not loaded');
      return;
    }

    if (property1SelectedTypes.length === 0) {
      setProperty1Amenities([]);
      return;
    }

    setProperty1LoadingAmenities(true);
    setProperty1AmenitiesError('');

    try {
      const service = new window.google.maps.places.PlacesService(mapInstanceRef.current);
      const promises = property1SelectedTypes.map(type => {
        return new Promise((resolve, reject) => {
          const request = {
            location: location,
            radius: SEARCH_RADIUS_METERS,
            type: type
          };

          service.nearbySearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              resolve(results.map(place => ({
                ...place,
                distance: window.google.maps.geometry.spherical.computeDistanceBetween(
                  location,
                  place.geometry.location
                )
              })));
            } else {
              resolve([]);
            }
          });
        });
      });

      const results = await Promise.all(promises);
      const allAmenities = results.flat().sort((a, b) => a.distance - b.distance);
      setProperty1Amenities(allAmenities);
    } catch (error) {
      console.error('Error searching Property 1 amenities:', error);
      setProperty1AmenitiesError('Failed to load amenities');
    } finally {
      setProperty1LoadingAmenities(false);
    }
  };

  // Amenities functionality for Property 2
  const toggleProperty2Amenity = (amenityType) => {
    setProperty2SelectedTypes(prev => {
      if (prev.includes(amenityType)) {
        return prev.filter(type => type !== amenityType);
      } else {
        return [...prev, amenityType];
      }
    });
  };

  const searchProperty2Amenities = async (location) => {
    if (!window.google || !window.google.maps) {
      setProperty2AmenitiesError('Google Maps not loaded');
      return;
    }

    if (property2SelectedTypes.length === 0) {
      setProperty2Amenities([]);
      return;
    }

    setProperty2LoadingAmenities(true);
    setProperty2AmenitiesError('');

    try {
      const service = new window.google.maps.places.PlacesService(mapInstanceRef.current);
      const promises = property2SelectedTypes.map(type => {
        return new Promise((resolve, reject) => {
          const request = {
            location: location,
            radius: SEARCH_RADIUS_METERS,
            type: type
          };

          service.nearbySearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              resolve(results.map(place => ({
                ...place,
                distance: window.google.maps.geometry.spherical.computeDistanceBetween(
                  location,
                  place.geometry.location
                )
              })));
            } else {
              resolve([]);
            }
          });
        });
      });

      const results = await Promise.all(promises);
      const allAmenities = results.flat().sort((a, b) => a.distance - b.distance);
      setProperty2Amenities(allAmenities);
    } catch (error) {
      console.error('Error searching Property 2 amenities:', error);
      setProperty2AmenitiesError('Failed to load amenities');
    } finally {
      setProperty2LoadingAmenities(false);
    }
  };

  // Search amenities when selected types change for Property 1
  useEffect(() => {
    if (property1LocationRef.current && property1SelectedTypes.length > 0) {
      searchProperty1Amenities(property1LocationRef.current);
    } else {
      setProperty1Amenities([]);
    }
  }, [property1SelectedTypes]);

  // Search amenities when selected types change for Property 2
  useEffect(() => {
    if (property2LocationRef.current && property2SelectedTypes.length > 0) {
      searchProperty2Amenities(property2LocationRef.current);
    } else {
      setProperty2Amenities([]);
    }
  }, [property2SelectedTypes]);

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          {/* Breadcrumb */}
          <div className="comparison-breadcrumb">
            Compare Prediction / {properties[0]?.address} vs {properties[1]?.address}
          </div>

          {/* Main Title */}
          <div className="comparison-content-header">
            <h1 className="comparison-main-title">
              Comparison for {properties[0]?.address} vs {properties[1]?.address}
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="comparison-action-buttons">
            {(() => {
              const userType = localStorage.getItem('userType') || 'free';
              const isFreeUser = userType.toLowerCase() === 'free';
              
              if (isFreeUser) {
                return null; // Hide download button for free users
              }
              
              return (
                <button className="comparison-action-btn comparison-download-btn" onClick={handleDownloadReport}>
                  <span className="comparison-btn-icon">📥</span>
                  Download Report
                </button>
              );
            })()}
            <button 
              className={`comparison-action-btn comparison-bookmark-btn ${isComparisonBookmarked ? 'active' : ''}`}
              onClick={handleBookmarkComparison}
              title={isComparisonBookmarked ? 'Remove comparison from bookmarks' : 'Bookmark comparison'}
            >
              <span className="comparison-btn-icon">🔖</span>
              {isComparisonBookmarked ? 'Comparison Saved' : 'Bookmark Comparison'}
            </button>
            <button 
              className={`comparison-action-btn comparison-bookmark-btn ${isPropertyBookmarked ? 'active' : ''}`}
              onClick={handleBookmarkAddress}
              title={isPropertyBookmarked ? 'Remove address from bookmarks' : 'Bookmark address'}
            >
              <span className="comparison-btn-icon">🔖</span>
              {isPropertyBookmarked ? 'Address Saved' : 'Bookmark Address'}
            </button>
          </div>

                     {/* Property Comparison Cards */}
           <div className="comparison-property-comparison">
             {/* Property 1 Card */}
             <PropertyCard
               property={properties[0]}
               comparisonData={comparisonData.property1}
               activeMapTab={activeMapTab}
               onMapTabChange={handleMapTabChange}
               mapId="property1-map"
               // ML prediction data
               mlPredictionData={property1MlData}
               // Amenities props for Property 1
               amenities={property1Amenities}
               selectedAmenityTypes={property1SelectedTypes}
               onToggleAmenity={toggleProperty1Amenity}
               isLoadingAmenities={property1LoadingAmenities}
               amenitiesError={property1AmenitiesError}
               amenityOptions={AMENITY_OPTIONS}
               // Data callback for export
               onDataUpdate={handleProperty1CardDataUpdate}
             />

             {/* VS Indicator */}
             <div className="comparison-vs-indicator">VS</div>

             {/* Property 2 Card */}
             <PropertyCard
               property={properties[1]}
               comparisonData={comparisonData.property2}
               activeMapTab={activeMapTab}
               onMapTabChange={handleMapTabChange}
               mapId="property2-map"
               // ML prediction data
               mlPredictionData={property2MlData}
               // Amenities props for Property 2
               amenities={property2Amenities}
               selectedAmenityTypes={property2SelectedTypes}
               onToggleAmenity={toggleProperty2Amenity}
               isLoadingAmenities={property2LoadingAmenities}
               amenitiesError={property2AmenitiesError}
               amenityOptions={AMENITY_OPTIONS}
               // Data callback for export
               onDataUpdate={handleProperty2CardDataUpdate}
             />
           </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Comparison;
