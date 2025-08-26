import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../context/ApiContext';
import { authAPI, onboardingAPI } from '../../services/api';
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

  // State for personalized recommendations
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [recommendationsError, setRecommendationsError] = useState('');

  // Fetch personalized recommendations based on user preferences
  const fetchPersonalizedRecommendations = async () => {
    try {
      setIsLoadingRecommendations(true);
      setRecommendationsError('');
      
      const response = await onboardingAPI.getUserRecommendations();
      console.log('Personalized recommendations:', response);
      
      if (response.recommendations && response.recommendations.length > 0) {
        // Transform API response to match the expected format and limit to 4
        const transformedRecommendations = response.recommendations
          .slice(0, 4) // Limit to 4 recommendations
          .map(property => ({
            id: property.id,
            title: property.title,
            address: property.address,
            price: formatPrice(property.price, property.price_type),
            propertyType: property.property_type,
            image: property.image || getDefaultImage(property.property_type),
            price_value: property.price,
            price_type: property.price_type
          }));
        
        setRecommendedProperties(transformedRecommendations);
      } else {
        // If no personalized recommendations, show empty state
        setRecommendedProperties([]);
      }
    } catch (error) {
      console.error('Error fetching personalized recommendations:', error);
      setRecommendationsError('Unable to load personalized recommendations');
      // Show empty state if API fails
      setRecommendedProperties([]);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // Helper function to format price (same as FirstTimer)
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

  // Helper function to get default image (same as FirstTimer)
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
        // This will now be handled by fetchPersonalizedRecommendations
        // setRecommendedProperties(getPersonalizedRecommendations(response.properties));
        
      } catch (error) {
        console.error('Error loading properties:', error);
        setPropertiesError(error.message || 'Failed to load properties');
        // Fallback to mock data if API fails
        // setRecommendedProperties(getPersonalizedRecommendations(mockProperties));
      } finally {
        setIsLoadingProperties(false);
      }
    };

    loadProperties();
    
    // Only load bookmarks if user is authenticated
    const token = localStorage.getItem('accessToken');
    if (token) {
      loadBookmarks();
      fetchPersonalizedRecommendations(); // Call fetchPersonalizedRecommendations here
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
              
              {/* Error Message for Recommendations */}
              {recommendationsError && (
                <div className="user-error-message">
                  {recommendationsError}
                </div>
              )}
              
              {/* Loading State for Recommendations */}
              {isLoadingRecommendations && (
                <div className="user-loading">
                  <p>Loading personalized recommendations...</p>
                </div>
              )}
              
              {/* Properties Grid */}
              {!isLoadingRecommendations && !recommendationsError && (
                <div className="user-property-grid">
                  {recommendedProperties.length > 0 ? (
                    recommendedProperties.map((property) => (
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
                    ))
                  ) : (
                    <div className="user-no-recommendations">
                      <p>No personalized recommendations available</p>
                      <p>Complete your preferences in the FirstTimer to get personalized suggestions</p>
                    </div>
                  )}
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
