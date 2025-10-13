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
    transactionType: 'all' // New filter for rental/buy
  });
  const navigate = useNavigate();

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

    return true;
  });

  const resetFilters = () => {
    setFilters({
      transactionType: 'all',
      propertyType: 'all',
      priceRange: 'all',
      location: 'all'
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
