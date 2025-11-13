import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import { propertiesAPI, BACKEND_ORIGIN } from '../../services/api';
import './PropertyListings.css';

const PropertyListings = () => {
  const [activeTab, setActiveTab] = useState('property-listings');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProperties, setTotalProperties] = useState(0);
  // Amenity options for filtering
  const AMENITY_OPTIONS = [
    { type: 'school', label: 'Schools', icon: '🏫' },
    { type: 'shopping_mall', label: 'Shopping Malls', icon: '🏬' },
    { type: 'hospital', label: 'Hospitals', icon: '🏥' },
    { type: 'subway_station', label: 'MRT Stations', icon: '🚇' },
    { type: 'bus_station', label: 'Bus Stations', icon: '🚌' },
    { type: 'supermarket', label: 'Supermarkets', icon: '🛒' },
    { type: 'restaurant', label: 'Restaurants', icon: '🍽️' },
    { type: 'gym', label: 'Gyms', icon: '💪' },
    { type: 'park', label: 'Parks', icon: '🌳' },
    { type: 'bank', label: 'Banks', icon: '🏦' }
  ];

  const [filters, setFilters] = useState({
    propertyType: 'all',
    priceRange: 'all',
    location: 'all',
    transactionType: 'all', // New filter for rental/buy
    amenities: [] // Array of selected amenity types
  });
  const [nearbyProperties, setNearbyProperties] = useState([]); // Properties near selected amenities
  const [isFilteringByAmenities, setIsFilteringByAmenities] = useState(false);
  const [amenityRadius, setAmenityRadius] = useState(1000); // Radius in meters (default 1km)
  const [apiKeyConfigured, setApiKeyConfigured] = useState(null); // Track if API key is configured (null = unknown)
  const navigate = useNavigate();

  // Fetch properties from database
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await propertiesAPI.getAll(currentPage, 8);
        console.log('Fetched properties from database:', response);
        setProperties(response.properties || []);
        setTotalProperties(response.total || 0);
        setTotalPages(response.pages || Math.ceil((response.total || 0) / 8));
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load properties. Please try again later.');
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [currentPage]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [filterType]: value
      };
      
      // Reset price range when transaction type changes
      if (filterType === 'transactionType') {
        newFilters.priceRange = 'all';
      }
      
      // Reset to first page when filters change
      setCurrentPage(1);
      
      return newFilters;
    });
  };

  const handlePropertyClick = (propertyId) => {
    navigate(`/dashboard/property-listing/${propertyId}`);
  };

  // Format price for display
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

  // Get default image based on property type
  const getDefaultImage = (propertyType) => {
    const images = {
      'Office': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
      'Retail': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
      'Shop House': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop',
      'Single-user Factory': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop',
      'Multiple-user Factory': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop',
      'Warehouse': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop',
      'Business Parks': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop'
    };
    return images[propertyType] || images['Office'];
  };

  // Construct full image URL from relative path
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    // If it's a relative path, construct full URL using backend origin
    if (imagePath.startsWith('/')) {
      return BACKEND_ORIGIN ? `${BACKEND_ORIGIN}${imagePath}` : imagePath;
    }
    // If it doesn't start with /, add it
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return BACKEND_ORIGIN ? `${BACKEND_ORIGIN}${path}` : path;
  };

  // Get unique cities for location filter
  const getUniqueCities = (properties) => {
    const cities = [...new Set(properties.map(property => property.city))];
    return cities.filter(city => city).sort();
  };

  // Generic location categories (same as FirstTimer)
  const locationCategories = [
    { id: 'CBD', name: 'Central Business District (CBD)', icon: '🏙️' },
    { id: 'City Fringe', name: 'City Fringe Areas', icon: '🏘️' },
    { id: 'Industrial Areas', name: 'Industrial & Manufacturing Areas', icon: '🏭' },
    { id: 'General', name: 'General Singapore Areas', icon: '🌏' }
  ];

  // Helper function to determine location category based on address/city
  const getLocationCategory = (property) => {
    const address = (property.address + ' ' + property.city).toLowerCase();
    
    // CBD areas
    if (address.includes('raffles') || address.includes('marina bay') || 
        address.includes('orchard') || address.includes('downtown') ||
        address.includes('tanjong pagar') || address.includes('chinatown')) {
      return 'CBD';
    }
    
    // City Fringe areas
    if (address.includes('novena') || address.includes('toa payoh') || 
        address.includes('ang mo kio') || address.includes('bishan') ||
        address.includes('serangoon') || address.includes('hougang')) {
      return 'City Fringe';
    }
    
    // Industrial areas
    if (address.includes('tuas') || address.includes('jurong') || 
        address.includes('woodlands') || address.includes('sembawang') ||
        address.includes('yishun') || address.includes('lim chu kang') ||
        address.includes('pioneer') || address.includes('gul') ||
        address.includes('benoi') || address.includes('boon lay')) {
      return 'Industrial Areas';
    }
    
    // Default to General
    return 'General';
  };

  // Filter properties based on selected filters
  const filteredProperties = properties.filter(property => {
    // Property type filter
    if (filters.propertyType !== 'all' && property.property_type !== filters.propertyType) {
      return false;
    }

    // Transaction type filter (price_type in database)
    if (filters.transactionType !== 'all') {
      const dbTransactionType = filters.transactionType === 'buy' ? 'sale' : 'rental';
      if (property.price_type !== dbTransactionType) {
        return false;
      }
    }

    // Price range filter
    if (filters.priceRange !== 'all') {
      const price = parseFloat(property.asking_price);
      
      if (property.price_type === 'rental') {
        // Rental price filtering (monthly rates)
        switch (filters.priceRange) {
          case 'under-5k':
            if (price >= 5000) return false;
            break;
          case '5k-10k':
            if (price < 5000 || price >= 10000) return false;
            break;
          case '10k-20k':
            if (price < 10000 || price >= 20000) return false;
            break;
          case '20k-50k':
            if (price < 20000 || price >= 50000) return false;
            break;
          case 'over-50k':
            if (price < 50000) return false;
            break;
          default:
            break;
        }
      } else {
        // Sale price filtering (total price)
        switch (filters.priceRange) {
          case 'under-1m':
            if (price >= 1000000) return false;
            break;
          case '1m-2m':
            if (price < 1000000 || price >= 2000000) return false;
            break;
          case '2m-5m':
            if (price < 2000000 || price >= 5000000) return false;
            break;
          case '5m-10m':
            if (price < 5000000 || price >= 10000000) return false;
            break;
          case 'over-10m':
            if (price < 10000000) return false;
            break;
          default:
            break;
        }
      }
    }

    // Location filter (using generic categories like FirstTimer)
    if (filters.location !== 'all') {
      const propertyLocationCategory = getLocationCategory(property);
      if (propertyLocationCategory !== filters.location) {
        return false;
      }
    }

    // Amenity filter - only show properties that are near selected amenities
    // If amenities are selected, only show properties that are in the nearbyProperties list
    if (filters.amenities.length > 0) {
      // If we're still loading, don't show any properties yet
      if (isFilteringByAmenities) {
        return false;
      }
      // If loading is complete but no nearby properties found, don't show this property
      if (nearbyProperties.length === 0) {
        return false;
      }
      // Only show properties that are in the nearbyProperties list
      // Convert both to numbers for consistent comparison
      if (!property.id) {
        console.warn('⚠️ Property missing ID:', property);
        return false;
      }
      const propertyId = Number(property.id);
      const nearbyIds = nearbyProperties.map(id => Number(id));
      const isIncluded = nearbyIds.includes(propertyId);
      if (!isIncluded) {
        return false;
      }
    }

    return true;
  });

  const resetFilters = () => {
    setFilters({
      transactionType: 'all',
      propertyType: 'all',
      priceRange: 'all',
      location: 'all',
      amenities: []
    });
    setNearbyProperties([]);
    setIsFilteringByAmenities(false);
  };

  // Handle amenity filter toggle
  const handleAmenityToggle = async (amenityType) => {
    const newAmenities = filters.amenities.includes(amenityType)
      ? filters.amenities.filter(a => a !== amenityType)
      : [...filters.amenities, amenityType];
    
    setFilters(prev => ({
      ...prev,
      amenities: newAmenities
    }));

    // If amenities are selected, fetch properties near those amenities
    if (newAmenities.length > 0) {
      await fetchPropertiesNearAmenities(newAmenities);
    } else {
      setNearbyProperties([]);
      setIsFilteringByAmenities(false);
    }
  };

  // Fetch properties near selected amenities
  const fetchPropertiesNearAmenities = async (amenityTypes) => {
    try {
      setIsFilteringByAmenities(true);
      console.log('🔍 Fetching properties near amenities:', amenityTypes, 'with radius:', amenityRadius);
      const response = await propertiesAPI.filterByAmenities(amenityTypes, amenityRadius);
      console.log('✅ Backend response:', response);
      console.log('✅ Backend property_ids:', response?.property_ids);
      console.log('✅ Backend property_ids type:', typeof response?.property_ids?.[0]);
      
      if (response && response.property_ids) {
        // Ensure all IDs are numbers for consistent comparison
        const numericIds = response.property_ids.map(id => Number(id));
        setNearbyProperties(numericIds);
        // Set based on explicit api_key_configured value from backend
        const isConfigured = response.api_key_configured === true || response.api_key_configured === undefined;
        setApiKeyConfigured(isConfigured);
        console.log(`✅ Found ${numericIds.length} properties near selected amenities`);
        console.log(`✅ Property IDs (as numbers):`, numericIds);
        console.log(`🔑 API Key configured: ${isConfigured} (backend returned: ${response.api_key_configured})`);
      } else {
        setNearbyProperties([]);
        // Don't set apiKeyConfigured to false if response doesn't have property_ids
        // It might be a different issue (no properties found, etc.)
        console.log('⚠️ No property_ids in response, setting to empty array');
      }
    } catch (error) {
      console.error('❌ Error fetching properties near amenities:', error);
      console.error('❌ Error details:', error.message);
      setNearbyProperties([]);
    } finally {
      setIsFilteringByAmenities(false);
    }
  };

  // Update when radius changes (if amenities are already selected)
  useEffect(() => {
    if (filters.amenities.length > 0 && !isFilteringByAmenities) {
      fetchPropertiesNearAmenities(filters.amenities);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amenityRadius]);

  // Get counts for different transaction types and location categories
  const getTransactionCounts = () => {
    const counts = {
      sale: 0,
      rental: 0,
      locations: {
        'CBD': 0,
        'City Fringe': 0,
        'Industrial Areas': 0,
        'General': 0
      }
    };

    properties.forEach(property => {
      if (property.price_type === 'sale') {
        counts.sale++;
      } else if (property.price_type === 'rental') {
        counts.rental++;
      }
      
      const locationCategory = getLocationCategory(property);
      if (counts.locations[locationCategory] !== undefined) {
        counts.locations[locationCategory]++;
      }
    });

    return counts;
  };

  const transactionCounts = getTransactionCounts();

  if (loading) {
    return (
      <div className="user-dashboard">
        <Header />
        <div className="user-dashboard-container">
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="user-main-content">
            <div className="user-content-header">
              <h1 className="user-main-title">Property Listings</h1>
            </div>
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading properties...</p>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          <div className="user-content-header">
            <h1 className="user-main-title">Property Listings</h1>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Try Again</button>
            </div>
          )}

          {/* Quick Filter Tabs */}
          <div className="quick-filter-tabs">
            <button 
              className={`quick-filter-tab ${filters.transactionType === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('transactionType', 'all')}
            >
              All Properties
            </button>
            <button 
              className={`quick-filter-tab ${filters.transactionType === 'buy' ? 'active' : ''}`}
              onClick={() => handleFilterChange('transactionType', 'buy')}
            >
              For Sale
            </button>
            <button 
              className={`quick-filter-tab ${filters.transactionType === 'rental' ? 'active' : ''}`}
              onClick={() => handleFilterChange('transactionType', 'rental')}
            >
              For Rent
            </button>
          </div>

          {/* Results Count */}
          <div className="results-count">
            <div className="results-summary">
              Showing {filteredProperties.length} out of {totalProperties} properties
            </div>
            <div className="transaction-counts">
              <span className="count-item buy">
                {transactionCounts.sale} For Sale
              </span>
              <span className="count-item rental">
                {transactionCounts.rental} For Rent
              </span>
            </div>
            
            <div className="location-counts">
              {locationCategories.map(category => (
                <span key={category.id} className="count-item location">
                  {category.icon} {transactionCounts.locations[category.id]} {category.name}
                </span>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <div className="filter-group">
              <label htmlFor="propertyType">Property Type</label>
              <select
                id="propertyType"
                value={filters.propertyType}
                onChange={(e) => handleFilterChange('propertyType', e.target.value)}
              >
                <option value="all">All Types</option>
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

            <div className="filter-group">
              <label htmlFor="priceRange">Price Range</label>
              <select
                id="priceRange"
                value={filters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
              >
                <option value="all">All Prices</option>
                {filters.transactionType === 'rental' ? (
                  // Rental price ranges
                  <>
                    <option value="under-5k">Under $5K/month</option>
                    <option value="5k-10k">$5K - $10K/month</option>
                    <option value="10k-20k">$10K - $20K/month</option>
                    <option value="20k-50k">$20K - $50K/month</option>
                    <option value="over-50k">Over $50K/month</option>
                  </>
                ) : (
                  // Sale price ranges
                  <>
                    <option value="under-1m">Under $1M</option>
                    <option value="1m-2m">$1M - $2M</option>
                    <option value="2m-5m">$2M - $5M</option>
                    <option value="5m-10m">$5M - $10M</option>
                    <option value="over-10m">Over $10M</option>
                  </>
                )}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="location">Location</label>
              <select
                id="location"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              >
                <option value="all">All Locations</option>
                {locationCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amenity Filters */}
          <div className="amenity-filters-section">
            <div className="amenity-filters-header">
              <label>Filter by Nearby Amenities</label>
              <div className="amenity-radius-selector">
                <label htmlFor="amenityRadius">Within:</label>
                <select
                  id="amenityRadius"
                  value={amenityRadius}
                  onChange={(e) => setAmenityRadius(Number(e.target.value))}
                >
                  <option value={500}>500m</option>
                  <option value={1000}>1km</option>
                  <option value={2000}>2km</option>
                  <option value={5000}>5km</option>
                </select>
              </div>
            </div>
            <div className="amenity-filters-grid">
              {AMENITY_OPTIONS.map(amenity => (
                <button
                  key={amenity.type}
                  type="button"
                  className={`amenity-filter-btn ${filters.amenities.includes(amenity.type) ? 'active' : ''}`}
                  onClick={() => handleAmenityToggle(amenity.type)}
                  disabled={isFilteringByAmenities}
                >
                  <span className="amenity-icon">{amenity.icon}</span>
                  <span className="amenity-label">{amenity.label}</span>
                  {filters.amenities.includes(amenity.type) && (
                    <span className="amenity-check">✓</span>
                  )}
                </button>
              ))}
            </div>
            {isFilteringByAmenities && (
              <div className="amenity-loading">
                <span>Searching for properties near amenities...</span>
              </div>
            )}
            {filters.amenities.length > 0 && !isFilteringByAmenities && (
              <div className="amenity-filter-info">
                {!apiKeyConfigured ? (
                  <div className="amenity-error-message">
                    ⚠️ Google Maps API key not configured
                    <br />
                    <small>For accurate amenity filtering, please set GOOGLE_MAPS_API_KEY in your backend environment variables. Currently showing all properties for testing.</small>
                  </div>
                ) : nearbyProperties.length > 0 ? (
                  <>
                    Showing properties within {amenityRadius}m of {filters.amenities.length} selected amenit{filters.amenities.length === 1 ? 'y' : 'ies'}
                    <br />
                    <small>Found {nearbyProperties.length} matching propert{nearbyProperties.length === 1 ? 'y' : 'ies'}</small>
                  </>
                ) : (
                  <div className="amenity-error-message">
                    ⚠️ No properties found near selected amenities
                    <br />
                    <small>Try adjusting the radius or selecting different amenities.</small>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Properties Grid */}
          {filteredProperties.length > 0 ? (
            <div className="properties-grid">
              {filteredProperties.map((property) => (
                <div 
                  key={property.id} 
                  className="property-card"
                  onClick={() => handlePropertyClick(property.id)}
                >
                  <div className="property-image-container">
                    <img 
                      src={property.image ? getImageUrl(property.image) : getDefaultImage(property.property_type)} 
                      alt={property.title}
                      className="property-image"
                      onError={(e) => {
                        // Fallback to default image if property image fails to load
                        e.target.src = getDefaultImage(property.property_type);
                      }}
                    />
                    <div className={`transaction-type-badge ${property.price_type === 'sale' ? 'buy' : 'rental'}`}>
                      {property.price_type === 'sale' ? 'For Sale' : 'For Rent'}
                    </div>
                  </div>
                  <div className="property-info">
                    <h3 className="property-title">{property.title}</h3>
                    <p className="property-address">{property.address}</p>
                    <div className="property-details">
                      <span className="property-type">{property.property_type}</span>
                      <span className="property-size">{property.size_sqft?.toLocaleString()} sq ft</span>
                    </div>
                    <div className="property-agent">
                      <span className="property-agent-label">Agent: </span>
                      <span className="property-agent-name">{property.agent_name}</span>
                    </div>
                    <div className="property-price">
                      {formatPrice(property.asking_price, property.price_type)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-properties">
              <p>No properties found matching your criteria.</p>
              <button onClick={resetFilters}>
                Clear All Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="property-listings-pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages} ({totalProperties} total properties)
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default PropertyListings;
