import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import { propertiesAPI } from '../../services/api';
import './EnhancedPropertySearch.css';

const EnhancedPropertySearch = () => {
  const [activeTab, setActiveTab] = useState('property-search');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [searchFilters, setSearchFilters] = useState({
    propertyType: 'all',
    priceRange: 'all',
    location: 'all',
    transactionType: 'all',
    // New proximity filters
    nearSchools: false,
    schoolTypes: [],
    nearAmenities: false,
    amenityTypes: [],
    maxDistance: 2, // km
    // Enhanced location search
    specificAddress: '',
    radius: 5 // km
  });

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
        
        // These would be actual API calls to fetch schools and amenities
        // For now, using mock data
        const mockSchools = [
          { id: 1, name: 'Raffles Institution', school_type: 'secondary', address: '1 Raffles Institution Lane', latitude: 1.2966, longitude: 103.7764 },
          { id: 2, name: 'Nanyang Primary School', school_type: 'primary', address: '52 Serangoon North Ave 4', latitude: 1.3681, longitude: 103.8750 },
          { id: 3, name: 'National University of Singapore', school_type: 'university', address: '21 Lower Kent Ridge Rd', latitude: 1.2966, longitude: 103.7764 }
        ];
        
        const mockAmenities = [
          { id: 1, name: 'Orchard Road Shopping Belt', amenity_type: 'shopping', address: 'Orchard Road', latitude: 1.3048, longitude: 103.8318 },
          { id: 2, name: 'Singapore General Hospital', amenity_type: 'healthcare', address: 'Outram Rd', latitude: 1.2789, longitude: 103.8335 },
          { id: 3, name: 'Raffles Place MRT', amenity_type: 'transport', address: 'Raffles Place', latitude: 1.2839, longitude: 103.8513 }
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

  const handleFilterChange = (filterType, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleMultiSelectChange = (filterType, value, checked) => {
    setSearchFilters(prev => {
      const currentArray = prev[filterType] || [];
      let newArray;
      
      if (checked) {
        newArray = [...currentArray, value];
      } else {
        newArray = currentArray.filter(item => item !== value);
      }
      
      return {
        ...prev,
        [filterType]: newArray
      };
    });
  };

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

  // Enhanced search function with proximity filtering
  const performSearch = async () => {
    setIsSearching(true);
    
    try {
      let filteredProperties = [...properties];

      // Basic filters
      if (searchFilters.propertyType !== 'all') {
        filteredProperties = filteredProperties.filter(p => p.property_type === searchFilters.propertyType);
      }

      if (searchFilters.transactionType !== 'all') {
        const dbTransactionType = searchFilters.transactionType === 'buy' ? 'sale' : 'rental';
        filteredProperties = filteredProperties.filter(p => p.price_type === dbTransactionType);
      }

      if (searchFilters.priceRange !== 'all') {
        filteredProperties = filteredProperties.filter(property => {
          const price = parseFloat(property.asking_price);
          // Price filtering logic here (same as PropertyListings.js)
          return true; // Simplified for now
        });
      }

      // Proximity filtering
      if (searchFilters.nearSchools && searchFilters.schoolTypes.length > 0) {
        filteredProperties = filteredProperties.filter(property => {
          if (!property.latitude || !property.longitude) return false;
          
          const nearbySchools = schools.filter(school => {
            if (!searchFilters.schoolTypes.includes(school.school_type)) return false;
            
            const distance = calculateDistance(
              property.latitude, property.longitude,
              school.latitude, school.longitude
            );
            
            return distance <= searchFilters.maxDistance;
          });
          
          return nearbySchools.length > 0;
        });
      }

      if (searchFilters.nearAmenities && searchFilters.amenityTypes.length > 0) {
        filteredProperties = filteredProperties.filter(property => {
          if (!property.latitude || !property.longitude) return false;
          
          const nearbyAmenities = amenities.filter(amenity => {
            if (!searchFilters.amenityTypes.includes(amenity.amenity_type)) return false;
            
            const distance = calculateDistance(
              property.latitude, property.longitude,
              amenity.latitude, amenity.longitude
            );
            
            return distance <= searchFilters.maxDistance;
          });
          
          return nearbyAmenities.length > 0;
        });
      }

      // Address-based radius search
      if (searchFilters.specificAddress) {
        // This would use geocoding to get coordinates for the address
        // For now, we'll skip this filter
      }

      setSearchResults(filteredProperties);
    } catch (error) {
      console.error('Error performing search:', error);
      setError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handlePropertyClick = (propertyId) => {
    navigate(`/dashboard/property-listing/${propertyId}`);
  };

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

  if (loading) {
    return (
      <div className="user-dashboard">
        <Header />
        <div className="user-dashboard-container">
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="user-main-content">
            <div className="user-content-header">
              <h1 className="user-main-title">Enhanced Property Search</h1>
            </div>
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading search options...</p>
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
            <h1 className="user-main-title">Enhanced Property Search</h1>
            <p className="search-subtitle">Find properties near schools, amenities, and more</p>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}

          {/* Search Filters */}
          <div className="enhanced-search-filters">
            <div className="filter-section">
              <h3>Basic Filters</h3>
              <div className="filter-row">
                <div className="filter-group">
                  <label>Property Type</label>
                  <select
                    value={searchFilters.propertyType}
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
                  <label>Transaction Type</label>
                  <select
                    value={searchFilters.transactionType}
                    onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="buy">For Sale</option>
                    <option value="rental">For Rent</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Price Range</label>
                  <select
                    value={searchFilters.priceRange}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  >
                    <option value="all">All Prices</option>
                    {searchFilters.transactionType === 'rental' ? (
                      <>
                        <option value="under-5k">Under $5K/month</option>
                        <option value="5k-10k">$5K - $10K/month</option>
                        <option value="10k-20k">$10K - $20K/month</option>
                        <option value="20k-50k">$20K - $50K/month</option>
                        <option value="over-50k">Over $50K/month</option>
                      </>
                    ) : (
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
              </div>
            </div>

            {/* Proximity Filters */}
            <div className="filter-section">
              <h3>Proximity Filters</h3>
              
              <div className="proximity-controls">
                <div className="proximity-toggle">
                  <label>
                    <input
                      type="checkbox"
                      checked={searchFilters.nearSchools}
                      onChange={(e) => handleFilterChange('nearSchools', e.target.checked)}
                    />
                    Search near schools
                  </label>
                </div>

                {searchFilters.nearSchools && (
                  <div className="school-types">
                    <label>School Types:</label>
                    <div className="checkbox-group">
                      {schoolTypes.map(type => (
                        <label key={type.id} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={searchFilters.schoolTypes.includes(type.id)}
                            onChange={(e) => handleMultiSelectChange('schoolTypes', type.id, e.target.checked)}
                          />
                          {type.icon} {type.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="proximity-toggle">
                  <label>
                    <input
                      type="checkbox"
                      checked={searchFilters.nearAmenities}
                      onChange={(e) => handleFilterChange('nearAmenities', e.target.checked)}
                    />
                    Search near amenities
                  </label>
                </div>

                {searchFilters.nearAmenities && (
                  <div className="amenity-types">
                    <label>Amenity Types:</label>
                    <div className="checkbox-group">
                      {amenityTypes.map(type => (
                        <label key={type.id} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={searchFilters.amenityTypes.includes(type.id)}
                            onChange={(e) => handleMultiSelectChange('amenityTypes', type.id, e.target.checked)}
                          />
                          {type.icon} {type.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="distance-control">
                  <label>Maximum Distance: {searchFilters.maxDistance} km</label>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={searchFilters.maxDistance}
                    onChange={(e) => handleFilterChange('maxDistance', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div className="search-actions">
              <button 
                className="search-btn"
                onClick={performSearch}
                disabled={isSearching}
              >
                {isSearching ? 'Searching...' : 'Search Properties'}
              </button>
              <button 
                className="clear-btn"
                onClick={() => {
                  setSearchFilters({
                    propertyType: 'all',
                    priceRange: 'all',
                    location: 'all',
                    transactionType: 'all',
                    nearSchools: false,
                    schoolTypes: [],
                    nearAmenities: false,
                    amenityTypes: [],
                    maxDistance: 2,
                    specificAddress: '',
                    radius: 5
                  });
                  setSearchResults([]);
                }}
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="search-results">
              <h2>Search Results ({searchResults.length} properties found)</h2>
              <div className="properties-grid">
                {searchResults.map((property) => (
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
                      <div className="property-price">
                        {formatPrice(property.asking_price, property.price_type)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.length === 0 && !isSearching && (
            <div className="no-results">
              <p>No properties found matching your criteria.</p>
              <p>Try adjusting your search filters or search near different amenities.</p>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default EnhancedPropertySearch;
