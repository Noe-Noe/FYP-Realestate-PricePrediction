import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../context/ApiContext';
import { authAPI } from '../../services/api';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
// Remove mock data import - will use real API data
import './user.css';

const User = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [recommendedProperties, setRecommendedProperties] = useState([]);
  const navigate = useNavigate();
  const { getUserName } = useApi();
  
  // Get user type from localStorage
  const userType = localStorage.getItem('userType') || 'free';

  // State for real properties from database
  const [properties, setProperties] = useState([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [propertiesError, setPropertiesError] = useState('');

  // State for bookmarks from database
  const [bookmarkedAddresses, setBookmarkedAddresses] = useState([]);
  const [bookmarkedPredictions, setBookmarkedPredictions] = useState([]);
  const [bookmarkedComparisons, setBookmarkedComparisons] = useState([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(true);
  const [bookmarksError, setBookmarksError] = useState('');

  // Mock properties data - same as PropertyListings and FirstTimer
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

  // Get personalized property recommendations based on user preferences
  const getPersonalizedRecommendations = (propertiesList = properties) => {
    const userPreferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
    const { propertyTypes = [], locations = [] } = userPreferences;

    let filteredProperties = propertiesList.length > 0 ? propertiesList : mockProperties;

    // Filter by property type interests
    if (propertyTypes.length > 0) {
      filteredProperties = filteredProperties.filter(property => {
        return propertyTypes.some(selectedType => {
          const propertyTypeLower = property.propertyType.toLowerCase();
          const selectedTypeLower = selectedType.toLowerCase();
          
          // Direct match
          if (propertyTypeLower === selectedTypeLower) return true;
          
          // Related matches
          if (selectedTypeLower === 'warehouse' && (propertyTypeLower === 'storage' || propertyTypeLower === 'logistics')) return true;
          if (selectedTypeLower === 'factory' && (propertyTypeLower === 'workshop' || propertyTypeLower === 'industrial')) return true;
          if (selectedTypeLower === 'office' && propertyTypeLower === 'commercial') return true;
          if (selectedTypeLower === 'retail' && propertyTypeLower === 'showroom') return true;
          
          return false;
        });
      });
    }

    // Filter by location preferences
    if (locations.length > 0) {
      filteredProperties = filteredProperties.filter(property => {
        return locations.some(location => {
          const addressLower = property.address.toLowerCase();
          
          if (location === 'cbd' && addressLower.includes('business avenue')) return true;
          if (location === 'industrial' && (addressLower.includes('industrial') || addressLower.includes('manufacturing') || addressLower.includes('development zone'))) return true;
          if (location === 'city-fringe' && addressLower.includes('shopping street')) return true;
          if (location === 'general') return true; // General regions match all
          
          return false;
        });
      });
    }

    // If no preferences or no matches, return top 3 properties
    if (filteredProperties.length === 0 || (propertyTypes.length === 0 && locations.length === 0)) {
      return mockProperties.slice(0, 3);
    }

    // Return up to 3 recommendations
    return filteredProperties.slice(0, 3);
  };

  // Load bookmarks from database
  const loadBookmarks = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('No access token found, skipping bookmarks load');
        setBookmarkedAddresses([]);
        setBookmarkedPredictions([]);
        setBookmarkedComparisons([]);
        return;
      }

      setIsLoadingBookmarks(true);
      setBookmarksError('');
      
      const response = await authAPI.getBookmarks();
      console.log('Bookmarks API response:', response);
      setBookmarkedAddresses(response.bookmarked_addresses || []);
      setBookmarkedPredictions(response.bookmarked_predictions || []);
      setBookmarkedComparisons(response.bookmarked_comparisons || []);
      console.log('Set bookmarked addresses:', response.bookmarked_addresses || []);
      console.log('Set bookmarked predictions:', response.bookmarked_predictions || []);
      console.log('Set bookmarked comparisons:', response.bookmarked_comparisons || []);
      
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      setBookmarksError(error.message || 'Failed to load bookmarks');
      // Set empty arrays if API fails
      setBookmarkedAddresses([]);
      setBookmarkedPredictions([]);
      setBookmarkedComparisons([]);
    } finally {
      setIsLoadingBookmarks(false);
    }
  };

  // Load properties from database
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setIsLoadingProperties(true);
        setPropertiesError('');
        
        const response = await authAPI.getUserProperties();
        setProperties(response.properties);
        
        // Set recommended properties based on user preferences
        setRecommendedProperties(getPersonalizedRecommendations(response.properties));
        
      } catch (error) {
        console.error('Error loading properties:', error);
        setPropertiesError(error.message || 'Failed to load properties');
        // Fallback to mock data if API fails
        setRecommendedProperties(getPersonalizedRecommendations(mockProperties));
      } finally {
        setIsLoadingProperties(false);
      }
    };

    loadProperties();
    
    // Only load bookmarks if user is authenticated
    const token = localStorage.getItem('accessToken');
    if (token) {
      loadBookmarks();
    }
  }, []);

  // Handler functions for view buttons
  const handleBookmarkedAddressView = (address) => {
    console.log('Address bookmark clicked:', address);
    // Navigate to price prediction with complete bookmark data
    navigate('/dashboard/priceprediction', { 
      state: { 
        prefillAddress: address.address,
        prefillPropertyType: address.property_type,
        prefillFloorArea: address.floor_area,
        prefillLevel: address.level,
        prefillUnit: address.unit_number,
        fromBookmark: true 
      } 
    });
  };

  const handlePropertyView = (property) => {
    // Navigate to property listing page
    navigate(`/dashboard/property-listing/${property.id}`);
  };

  const handleComparisonView = (comparison) => {
    // Navigate directly to comparison results page with actual bookmark data
    navigate('/dashboard/comparison', { 
      state: { 
        properties: [
          {
            id: Date.now(),
            propertyType: comparison.property_type || 'Industrial Property',
            address: comparison.address,
            floorArea: comparison.floor_area || '',
            level: comparison.level || 'Ground Floor',
            unit: comparison.unit_number || 'A-01'
          },
          {
            id: Date.now() + 1,
            propertyType: comparison.property_type_2 || 'Commercial Space',
            address: comparison.address_2 || 'Not specified',
            floorArea: comparison.floor_area_2 || '',
            level: comparison.level_2 || 'Level 1',
            unit: comparison.unit_number_2 || 'B-15'
          }
        ],
        fromBookmark: true,
        bookmarkData: comparison
      } 
    });
  };

  const handlePredictionView = (prediction) => {
    console.log('Prediction bookmark clicked:', prediction);
    // Navigate directly to prediction results page with correct bookmark data
    navigate('/dashboard/prediction', { 
      state: { 
        searchData: {
          address: prediction.address,
          propertyType: prediction.property_type,
          floorArea: prediction.floor_area,
          level: prediction.level,
          unit: prediction.unit_number
        },
        fromBookmark: true 
      } 
    });
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
            <h1 className="user-main-title">User's Dashboard</h1>
            <p className="user-welcome-message">Welcome back, {getUserName()}</p>
          </div>

          <div className="user-dashboard-sections">
            {/* Bookmarked Addresses */}
            <section className="user-dashboard-section">
              <div className="user-section-header">
                <h2 className="user-section-title">Bookmarked Addresses</h2>
                <button 
                  className="user-view-more-btn"
                  onClick={() => navigate('/bookmarks')}
                >
                  View More
                </button>
              </div>
              
              {/* Loading State */}
              {isLoadingBookmarks && (
                <div className="user-loading">
                  <p>Loading bookmarks...</p>
                </div>
              )}
              
              {/* Error Message */}
              {bookmarksError && (
                <div className="user-error-message">
                  {bookmarksError}
                </div>
              )}
              
              {/* Bookmarked Addresses List */}
              {!isLoadingBookmarks && !bookmarksError && (
                <div className="user-address-list">
                  {bookmarkedAddresses.length > 0 ? (
                    bookmarkedAddresses.slice(0, 3).map((address) => (
                      <div key={address.id} className="user-address-item">
                        <span className="user-address-text">{address.address}</span>
                        <button 
                          className="user-view-btn"
                          onClick={() => handleBookmarkedAddressView(address)}
                        >
                          View
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="user-no-bookmarks">
                      <p>No bookmarked addresses yet</p>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Comparisons - Only for Premium Users */}
            {userType === 'premium' && (
              <section className="user-dashboard-section">
                <div className="user-section-header">
                  <h2 className="user-section-title">Bookmarked Comparisons</h2>
                  <button 
                    className="user-view-more-btn"
                    onClick={() => navigate('/bookmarks')}
                  >
                    View More
                  </button>
                </div>
                
                {/* Loading State */}
                {isLoadingBookmarks && (
                  <div className="user-loading">
                    <p>Loading bookmarks...</p>
                  </div>
                )}
                
                {/* Error Message */}
                {bookmarksError && (
                  <div className="user-error-message">
                    {bookmarksError}
                  </div>
                )}
                
                {/* Bookmarked Comparisons List */}
                {!isLoadingBookmarks && !bookmarksError && (
                  <div className="user-address-list">
                    {bookmarkedComparisons.length > 0 ? (
                      bookmarkedComparisons.map((comparison) => (
                        <div key={comparison.id} className="user-address-item">
                          <div className="user-address-text">
                            <div className="comparison-addresses">
                              <div className="address-1">
                                <strong>Property 1:</strong> {comparison.address}
                              </div>
                              <div className="address-2">
                                <strong>Property 2:</strong> {comparison.address_2 || 'Not specified'}
                              </div>
                            </div>
                          </div>
                          <button 
                            className="user-view-btn"
                            onClick={() => handleComparisonView(comparison)}
                          >
                            View Results
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="user-no-bookmarks">
                        <p>No bookmarked comparisons yet</p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Predictions */}
            <section className="user-dashboard-section">
              <div className="user-section-header">
                <h2 className="user-section-title">Bookmarked Predictions</h2>
                <button 
                  className="user-view-more-btn"
                  onClick={() => navigate('/bookmarks')}
                >
                  View More
                </button>
              </div>
              
              {/* Loading State */}
              {isLoadingBookmarks && (
                <div className="user-loading">
                  <p>Loading bookmarks...</p>
                </div>
              )}
              
              {/* Error Message */}
              {bookmarksError && (
                <div className="user-error-message">
                  {bookmarksError}
                </div>
              )}
              
              {/* Bookmarked Predictions List */}
              {!isLoadingBookmarks && !bookmarksError && (
                <div className="user-address-list">
                  {bookmarkedPredictions.length > 0 ? (
                    bookmarkedPredictions.map((property) => (
                      <div key={property.id} className="user-address-item">
                        <span className="user-address-text">{property.address}</span>
                        <button 
                          className="user-view-btn"
                          onClick={() => handlePredictionView(property)}
                        >
                          View Results
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="user-no-bookmarks">
                      <p>No bookmarked predictions yet</p>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Recommended Properties - Based on FirstTimer preferences */}
            <section className="user-dashboard-section">
              <div className="user-section-header">
                <h2 className="user-section-title">Properties you might be interested in:</h2>
                <button 
                  className="user-view-more-btn"
                  onClick={() => navigate('/dashboard/property-listings')}
                >
                  View More
                </button>
              </div>
              
              {/* Error Message */}
              {propertiesError && (
                <div className="user-error-message">
                  {propertiesError}
                </div>
              )}
              
              {/* Loading State */}
              {isLoadingProperties && (
                <div className="user-loading">
                  <p>Loading properties...</p>
                </div>
              )}
              
              {/* Properties Grid */}
              {!isLoadingProperties && !propertiesError && (
                <div className="user-property-grid">
                  {recommendedProperties.map((property) => (
                    <div key={property.id} className="user-property-card">
                      <div className="user-property-image">
                        <img src={property.image} alt={property.title} />
                        <div className="user-property-type-badge">{property.propertyType}</div>
                      </div>
                      <div className="user-property-info">
                        <h3 className="user-property-name">{property.title}</h3>
                        <p className="user-property-address">{property.address}</p>
                        <p className="user-property-value">{property.price}</p>
                      </div>
                      <button 
                        className="user-view-btn"
                        onClick={() => handlePropertyView(property)}
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default User;
