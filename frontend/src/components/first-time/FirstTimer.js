import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../sharedpages/header';
import Footer from '../sharedpages/footer';
import { onboardingAPI, propertiesAPI } from '../../services/api';
import './FirstTimer.css';

const FirstTimer = () => {
  const navigate = useNavigate();
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  // Check if user should be on this page
  useEffect(() => {
    console.log('🔍 FirstTimer - Starting authentication check...');
    
    const userType = localStorage.getItem('userType');
    const accessToken = localStorage.getItem('accessToken');
    
    console.log('🔍 FirstTimer - userType:', userType);
    console.log('🔍 FirstTimer - accessToken:', accessToken ? '✅ Present' : '❌ Missing');
    
    if (!accessToken) {
      console.log('❌ FirstTimer - No access token, redirecting to login');
      navigate('/login');
      return;
    }
    
    // Only Free and Premium users should access FirstTimer
    if (userType === 'agent' || userType === 'admin') {
      console.log('❌ FirstTimer - User type not allowed, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }
    
    console.log('✅ FirstTimer - User authenticated and authorized, staying on page');
  }, [navigate]);

  // Fetch properties from database
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await propertiesAPI.getAll();
        console.log('Fetched properties for recommendations:', response);
        // setProperties(response.properties || []); // This line is removed as per new_code
      } catch (error) {
        console.error('Error fetching properties for recommendations:', error);
        // setProperties([]); // This line is removed as per new_code
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const propertyTypes = [
    { id: 'Office', name: 'Office', icon: '🏢' },
    { id: 'Retail', name: 'Retail Space', icon: '🏪' },
    { id: 'Shop House', name: 'Shop House', icon: '🏘️' },
    { id: 'Business Parks', name: 'Business Parks', icon: '🏢' },
    { id: 'Single-user Factory', name: 'Single-user Factory', icon: '🏭' },
    { id: 'Multiple-user Factory', name: 'Multiple-user Factory', icon: '🏭' },
    { id: 'Warehouse', name: 'Warehouse', icon: '🏭' }
  ];

  const locationPreferences = [
    { id: 'CBD', name: 'Central Business District (CBD)', icon: '🏙️' },
    { id: 'City Fringe', name: 'City Fringe Areas', icon: '🏘️' },
    { id: 'Industrial Areas', name: 'Industrial & Manufacturing Areas', icon: '🏭' },
    { id: 'General', name: 'General Singapore Areas', icon: '��️' }
  ];

  // Get default image based on property type (same as PropertyListings)
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

  // Format price for display (same as PropertyListings)
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

  const togglePropertyType = (propertyId) => {
    setSelectedPropertyTypes(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const toggleLocation = (locationId) => {
    setSelectedLocations(prev => 
      prev.includes(locationId) 
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  const handleSaveAndContinue = async () => {
    try {
      // Save user preferences to backend
      const userPreferences = {
        propertyTypes: selectedPropertyTypes,
        locations: selectedLocations
      };
      
      await onboardingAPI.saveUserPreferences(userPreferences);
      
      // Also save to localStorage as backup
      localStorage.setItem('userPreferences', JSON.stringify({
        ...userPreferences,
        completed: true
      }));
      
      // Fetch recommendations from API
      setRecommendationsLoading(true);
      try {
        const response = await onboardingAPI.getUserRecommendations();
        setRecommendations(response.recommendations || []);
      } catch (recError) {
        console.error('Error fetching recommendations:', recError);
        setRecommendations([]);
      } finally {
        setRecommendationsLoading(false);
      }
      
      // Show property recommendations
      setShowRecommendations(true);
    } catch (error) {
      console.error('Error saving preferences:', error);
      // Still save to localStorage and show recommendations
      const userPreferences = {
        propertyTypes: selectedPropertyTypes,
        locations: selectedLocations,
        completed: true
      };
      localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
      setShowRecommendations(true);
    }
  };

  const handleSkip = async () => {
    try {
      // Mark as completed without preferences
      const userPreferences = {
        propertyTypes: [],
        locations: [],
        completed: true
      };
      
      localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
      
      // Mark onboarding as completed in backend
      await onboardingAPI.completeUser();
      
      // Navigate to main dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still navigate even if API call fails
      navigate('/dashboard');
    }
  };

  const handleContinueToDashboard = async () => {
    try {
      // Mark onboarding as completed in backend
      await onboardingAPI.completeUser();
      console.log('✅ Onboarding marked as completed');
      
      // Navigate to main dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still navigate even if API call fails
      navigate('/dashboard');
    }
  };

  const handleViewProperty = (propertyId) => {
    navigate(`/dashboard/property-listing/${propertyId}`);
  };

  if (showRecommendations) {
    return (
      <div className="first-timer-container">
        <Header />
        
        <main className="first-timer-main-content">
          <div className="first-timer-content">
            <div className="first-timer-welcome-section">
              <h1 className="first-timer-welcome-title">Property Recommendations</h1>
              <p className="first-timer-welcome-subtitle">
                Based on your interests, here are some properties you might like:
              </p>
            </div>

            {recommendationsLoading ? (
              <div className="first-timer-loading">
                <div className="first-timer-loading-spinner"></div>
                <p>Finding the perfect properties for you...</p>
              </div>
            ) : recommendations.length > 0 ? (
              <div className="first-timer-recommendations-grid">
                {recommendations.map((property) => (
                  <div key={property.id} className="first-timer-property-card">
                    <div className="first-timer-property-image">
                      <img src={property.image || getDefaultImage(property.property_type)} alt={property.title} />
                      <div className="first-timer-property-type-badge">{property.property_type}</div>
                    </div>
                    
                    <div className="first-timer-property-content">
                      <h3 className="first-timer-property-title">{property.title}</h3>
                      <p className="first-timer-property-address">{property.address}</p>
                      <div className="first-timer-property-price">{formatPrice(property.price, property.price_type)}</div>
                      <button 
                        className="first-timer-view-btn"
                        onClick={() => handleViewProperty(property.id)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="first-timer-no-recommendations">
                <p>No recommendations found based on your preferences.</p>
                <p>Try adjusting your property type and location preferences.</p>
              </div>
            )}

            <div className="first-timer-action-buttons">
              <button 
                className="first-timer-continue-btn"
                onClick={handleContinueToDashboard}
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="first-timer-container">
      <Header />
      
      <main className="first-timer-main-content">
        <div className="first-timer-content">
          <div className="first-timer-welcome-section">
            <h1 className="first-timer-welcome-title">Welcome! Tell Us About Your Interests</h1>
            <p className="first-timer-welcome-subtitle">
              Customize your property search by selecting the types of properties and locations you're interested in.
            </p>
          </div>

          <div className="first-timer-interests-section">
            <div className="first-timer-property-types-section">
              <h2 className="first-timer-section-title">Property Types</h2>
              <div className="first-timer-selection-cards">
                {propertyTypes.map((property) => (
                  <div
                    key={property.id}
                    className={`first-timer-selection-card ${selectedPropertyTypes.includes(property.id) ? 'first-timer-selected' : ''}`}
                    onClick={() => togglePropertyType(property.id)}
                  >
                    <div className="first-timer-card-icon">{property.icon}</div>
                    <div className="first-timer-card-text">{property.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="first-timer-location-preferences-section">
              <h2 className="first-timer-section-title">Location Preferences</h2>
              <div className="first-timer-selection-cards">
                {locationPreferences.map((location) => (
                  <div
                    key={location.id}
                    className={`first-timer-selection-card ${selectedLocations.includes(location.id) ? 'first-timer-selected' : ''}`}
                    onClick={() => toggleLocation(location.id)}
                  >
                    <div className="first-timer-card-icon">{location.icon}</div>
                    <div className="first-timer-card-text">{location.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="first-timer-action-buttons">
            <button 
              className="first-timer-save-continue-btn"
              onClick={handleSaveAndContinue}
            >
              Save Interests & Continue
            </button>
            <button 
              className="first-timer-skip-btn"
              onClick={handleSkip}
            >
              Skip
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FirstTimer;
