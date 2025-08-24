import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './PropertyListings.css';

const PropertyListings = () => {
  const [activeTab, setActiveTab] = useState('property-listings');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    propertyType: 'all',
    priceRange: 'all',
    location: 'all'
  });
  const navigate = useNavigate();

  // Mock properties data - matching the design in the image
  const mockProperties = [
    {
      id: '1',
      title: 'Warehouse',
      address: '123 Industrial Road, Singapore',
      price: '$2,500,000',
      propertyType: 'Warehouse',
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'
    },
    {
      id: '2',
      title: 'Factory',
      address: '456 Manufacturing Lane, Singapore',
      price: '$1,800,000',
      propertyType: 'Factory',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop'
    },
    {
      id: '3',
      title: 'Office Space',
      address: '789 Business Avenue, Singapore',
      price: '$3,200,000',
      propertyType: 'Office',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop'
    },
    {
      id: '4',
      title: 'Retail Unit',
      address: '101 Shopping Street, Singapore',
      price: '$1,500,000',
      propertyType: 'Retail',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop'
    },
    {
      id: '5',
      title: 'Industrial Land',
      address: '222 Development Zone, Singapore',
      price: '$4,000,000',
      propertyType: 'Industrial',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop'
    },
    {
      id: '6',
      title: 'Commercial Building',
      address: '333 Trade Center, Singapore',
      price: '$6,000,000',
      propertyType: 'Commercial',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop'
    },
    {
      id: '7',
      title: 'Showroom',
      address: '444 Display Road, Singapore',
      price: '$2,200,000',
      propertyType: 'Showroom',
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'
    },
    {
      id: '8',
      title: 'Workshop',
      address: '555 Repair Street, Singapore',
      price: '$1,200,000',
      propertyType: 'Workshop',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop'
    },
    {
      id: '9',
      title: 'Storage Facility',
      address: '666 Storage Lane, Singapore',
      price: '$2,800,000',
      propertyType: 'Storage',
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'
    },
    {
      id: '10',
      title: 'Logistics Hub',
      address: '777 Logistics Avenue, Singapore',
      price: '$5,500,000',
      propertyType: 'Logistics',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProperties(mockProperties);
      setLoading(false);
    }, 500);
  }, []);

  const handlePropertyClick = (propertyId) => {
    navigate(`/dashboard/property-listing/${propertyId}`);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const filteredProperties = properties.filter(property => {
    if (filters.propertyType !== 'all' && property.propertyType !== filters.propertyType) {
      return false;
    }
    if (filters.location !== 'all' && !property.address.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="property-listings-loading">
        <div className="loading-spinner"></div>
        <p>Loading properties...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <Header />
      
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="user-main-content">
          {/* Header */}
          <div className="user-content-header">
            <h1 className="user-main-title">Property Listings</h1>
            
            {/* Filters */}
            <div className="listings-filters">
              <div className="filter-group">
                <label htmlFor="propertyType">Property Type:</label>
                <select 
                  id="propertyType"
                  value={filters.propertyType}
                  onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Factory">Factory</option>
                  <option value="Office">Office</option>
                  <option value="Retail">Retail</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Showroom">Showroom</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Storage">Storage</option>
                  <option value="Logistics">Logistics</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="location">Location:</label>
                <select 
                  id="location"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                >
                  <option value="all">All Locations</option>
                  <option value="Jurong">Jurong</option>
                  <option value="Tuas">Tuas</option>
                  <option value="Changi">Changi</option>
                  <option value="Pasir Panjang">Pasir Panjang</option>
                  <option value="Woodlands">Woodlands</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="results-count">
            <p>Showing {filteredProperties.length} of {properties.length} properties</p>
          </div>

          {/* Properties Grid */}
          <div className="properties-grid">
            {filteredProperties.map((property) => (
              <div 
                key={property.id} 
                className="property-card"
                onClick={() => handlePropertyClick(property.id)}
              >
                <div className="property-image">
                  <img src={property.image} alt={property.title} />
                  <div className="property-type-badge">{property.propertyType}</div>
                </div>
                
                                 <div className="property-content">
                   <h3 className="property-title">{property.title}</h3>
                   <p className="property-address">{property.address}</p>
                   <div className="property-price">{property.price}</div>
                 </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {filteredProperties.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon">🏢</div>
              <h3>No properties found</h3>
              <p>Try adjusting your filters to see more properties</p>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default PropertyListings;
