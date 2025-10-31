import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import { propertiesAPI } from '../../services/api';
import './PropertyListings.css';

const PropertyListings = () => {
  const [activeTab, setActiveTab] = useState('property-listings');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    propertyType: 'all',
    priceRange: 'all',
    location: 'all',
    transactionType: 'all', // New filter for rental/buy
    // Proximity search filters
    nearSchools: false,
    schoolTypes: [],
    nearAmenities: false,
    amenityTypes: [],
    maxDistance: 2, // km
    specificAddress: '',
    radius: 5 // km
  });

  // School and amenity data
  const [schools, setSchools] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingAmenities, setLoadingAmenities] = useState(false);
  const navigate = useNavigate();

  // School and amenity types
  const schoolTypes = [
    { id: 'primary', name: 'Primary Schools', icon: '🏫' },
    { id: 'secondary', name: 'Secondary Schools', icon: '🎓' },
    { id: 'junior_college', name: 'Junior Colleges', icon: '📚' },
    { id: 'university', name: 'Universities', icon: '🎓' }
  ];

  const amenityTypes = [
    { id: 'shopping', name: 'Shopping Centers', icon: '🛍️' },
    { id: 'healthcare', name: 'Healthcare Facilities', icon: '🏥' },
    { id: 'transport', name: 'Transport Hubs', icon: '🚇' },
    { id: 'recreation', name: 'Recreation Facilities', icon: '🏊' },
    { id: 'dining', name: 'Dining Options', icon: '🍽️' }
  ];

  // Fetch properties from database
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await propertiesAPI.getAll();
        console.log('Fetched properties from database:', response);
        setProperties(response.properties || []);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load properties. Please try again later.');
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Fetch schools and amenities
  useEffect(() => {
    const fetchSchoolsAndAmenities = async () => {
      try {
        setLoadingSchools(true);
        setLoadingAmenities(true);
        
        // Mock data for schools and amenities
        // In a real app, these would be API calls
        const mockSchools = [
          { id: 1, name: 'Raffles Institution', school_type: 'secondary', address: '1 Raffles Institution Lane', latitude: 1.2966, longitude: 103.7764 },
          { id: 2, name: 'Nanyang Primary School', school_type: 'primary', address: '52 Serangoon North Ave 4', latitude: 1.3681, longitude: 103.8750 },
          { id: 3, name: 'National University of Singapore', school_type: 'university', address: '21 Lower Kent Ridge Rd', latitude: 1.2966, longitude: 103.7764 },
          { id: 4, name: 'Anglo-Chinese School', school_type: 'secondary', address: '25 Dover Close East', latitude: 1.2966, longitude: 103.7764 },
          { id: 5, name: 'Methodist Girls School', school_type: 'secondary', address: '11 Blackmore Drive', latitude: 1.2966, longitude: 103.7764 }
        ];
        
        const mockAmenities = [
          { id: 1, name: 'Orchard Road Shopping Belt', amenity_type: 'shopping', address: 'Orchard Road', latitude: 1.3048, longitude: 103.8318 },
          { id: 2, name: 'Singapore General Hospital', amenity_type: 'healthcare', address: 'Outram Rd', latitude: 1.2789, longitude: 103.8335 },
          { id: 3, name: 'Raffles Place MRT', amenity_type: 'transport', address: 'Raffles Place', latitude: 1.2839, longitude: 103.8513 },
          { id: 4, name: 'Marina Bay Sands', amenity_type: 'recreation', address: '10 Bayfront Ave', latitude: 1.2839, longitude: 103.8583 },
          { id: 5, name: 'Chinatown Food Street', amenity_type: 'dining', address: 'Smith Street', latitude: 1.2839, longitude: 103.8436 }
        ];
        
        setSchools(mockSchools);
        setAmenities(mockAmenities);
      } catch (err) {
        console.error('Error fetching schools and amenities:', err);
      } finally {
        setLoadingSchools(false);
        setLoadingAmenities(false);
      }
    };

    fetchSchoolsAndAmenities();
  }, []);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

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
      
      return newFilters;
    });
  };

  // Proximity search handlers
  const handleProximityToggle = (type) => {
    setFilters(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleSchoolTypeToggle = (schoolType) => {
    setFilters(prev => ({
      ...prev,
      schoolTypes: prev.schoolTypes.includes(schoolType)
        ? prev.schoolTypes.filter(type => type !== schoolType)
        : [...prev.schoolTypes, schoolType]
    }));
  };

  const handleAmenityTypeToggle = (amenityType) => {
    setFilters(prev => ({
      ...prev,
      amenityTypes: prev.amenityTypes.includes(amenityType)
        ? prev.amenityTypes.filter(type => type !== amenityType)
        : [...prev.amenityTypes, amenityType]
    }));
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

    // Proximity search filters
    if (filters.nearSchools && filters.schoolTypes.length > 0) {
      if (!property.latitude || !property.longitude) return false;
      
      const nearbySchools = schools.filter(school => {
        if (!filters.schoolTypes.includes(school.school_type)) return false;
        
        const distance = calculateDistance(
          property.latitude, property.longitude,
          school.latitude, school.longitude
        );
        
        return distance <= filters.maxDistance;
      });
      
      if (nearbySchools.length === 0) return false;
    }

    if (filters.nearAmenities && filters.amenityTypes.length > 0) {
      if (!property.latitude || !property.longitude) return false;
      
      const nearbyAmenities = amenities.filter(amenity => {
        if (!filters.amenityTypes.includes(amenity.amenity_type)) return false;
        
        const distance = calculateDistance(
          property.latitude, property.longitude,
          amenity.latitude, amenity.longitude
        );
        
        return distance <= filters.maxDistance;
      });
      
      if (nearbyAmenities.length === 0) return false;
    }

    return true;
  });

  const resetFilters = () => {
    setFilters({
      transactionType: 'all',
      propertyType: 'all',
      priceRange: 'all',
      location: 'all',
      nearSchools: false,
      schoolTypes: [],
      nearAmenities: false,
      amenityTypes: [],
      maxDistance: 2,
      specificAddress: '',
      radius: 5
    });
  };

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
              Showing {filteredProperties.length} of {properties.length} properties
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

            {/* Proximity Search Filters */}
            <div className="proximity-filters">
              <h3 className="proximity-filters-title">📍 Search by Proximity</h3>
              
              {/* Schools Filter */}
              <div className="proximity-filter-group">
                <label className="proximity-filter-toggle">
                  <input
                    type="checkbox"
                    checked={filters.nearSchools}
                    onChange={() => handleProximityToggle('nearSchools')}
                  />
                  <span className="proximity-filter-label">Near Schools</span>
                </label>
                
                {filters.nearSchools && (
                  <div className="proximity-options">
                    <div className="proximity-options-grid">
                      {schoolTypes.map(type => (
                        <label key={type.id} className="proximity-option">
                          <input
                            type="checkbox"
                            checked={filters.schoolTypes.includes(type.id)}
                            onChange={() => handleSchoolTypeToggle(type.id)}
                          />
                          <span className="proximity-option-icon">{type.icon}</span>
                          <span className="proximity-option-label">{type.name}</span>
                        </label>
                      ))}
                    </div>
                    <div className="proximity-distance">
                      <label>Within: </label>
                      <select
                        value={filters.maxDistance}
                        onChange={(e) => handleFilterChange('maxDistance', parseInt(e.target.value))}
                      >
                        <option value={1}>1 km</option>
                        <option value={2}>2 km</option>
                        <option value={5}>5 km</option>
                        <option value={10}>10 km</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Amenities Filter */}
              <div className="proximity-filter-group">
                <label className="proximity-filter-toggle">
                  <input
                    type="checkbox"
                    checked={filters.nearAmenities}
                    onChange={() => handleProximityToggle('nearAmenities')}
                  />
                  <span className="proximity-filter-label">Near Amenities</span>
                </label>
                
                {filters.nearAmenities && (
                  <div className="proximity-options">
                    <div className="proximity-options-grid">
                      {amenityTypes.map(type => (
                        <label key={type.id} className="proximity-option">
                          <input
                            type="checkbox"
                            checked={filters.amenityTypes.includes(type.id)}
                            onChange={() => handleAmenityTypeToggle(type.id)}
                          />
                          <span className="proximity-option-icon">{type.icon}</span>
                          <span className="proximity-option-label">{type.name}</span>
                        </label>
                      ))}
                    </div>
                    <div className="proximity-distance">
                      <label>Within: </label>
                      <select
                        value={filters.maxDistance}
                        onChange={(e) => handleFilterChange('maxDistance', parseInt(e.target.value))}
                      >
                        <option value={1}>1 km</option>
                        <option value={2}>2 km</option>
                        <option value={5}>5 km</option>
                        <option value={10}>10 km</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
                      src={getDefaultImage(property.property_type)} 
                      alt={property.title}
                      className="property-image"
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
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default PropertyListings;
