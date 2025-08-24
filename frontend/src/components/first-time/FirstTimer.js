import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../sharedpages/header';
import Footer from '../sharedpages/footer';
import './FirstTimer.css';

const FirstTimer = () => {
  const navigate = useNavigate();
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Check if user should be on this page
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    
    // Only Free and Premium users should access FirstTimer
    if (userType === 'agent' || userType === 'admin') {
      navigate('/dashboard');
      return;
    }
  }, [navigate]);

  const propertyTypes = [
    { id: 'warehouse', name: 'Warehouse', icon: '🏭' },
    { id: 'factory', name: 'Factory', icon: '🏢' },
    { id: 'office', name: 'Office', icon: '🏢' },
    { id: 'retail', name: 'Retail Space', icon: '🏪' },
  ];

  const locationPreferences = [
    { id: 'cbd', name: 'Central Business District (CBD)', icon: '🏙️' },
    { id: 'industrial', name: 'Industrial Parks (e.g., Jurong, Woodlands)', icon: '🏭' },
    { id: 'city-fringe', name: 'City Fringe', icon: '🏘️' },
    { id: 'general', name: 'General Regions', icon: '🗺️' }
  ];

  // Mock property recommendations based on interests - using same data as PropertyListings
  const getPropertyRecommendations = () => {
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

    // Filter properties based on selected interests
    let filteredProperties = mockProperties;

    // Filter by property type interests
    if (selectedPropertyTypes.length > 0) {
      filteredProperties = filteredProperties.filter(property => {
        return selectedPropertyTypes.some(selectedType => {
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
    if (selectedLocations.length > 0) {
      filteredProperties = filteredProperties.filter(property => {
        return selectedLocations.some(location => {
          const addressLower = property.address.toLowerCase();
          
          if (location === 'cbd' && addressLower.includes('business avenue')) return true;
          if (location === 'industrial' && (addressLower.includes('industrial') || addressLower.includes('manufacturing') || addressLower.includes('development zone'))) return true;
          if (location === 'city-fringe' && addressLower.includes('shopping street')) return true;
          if (location === 'general') return true; // General regions match all
          
          return false;
        });
      });
    }

    // If no filters applied or no matches, return top 4 properties
    if (filteredProperties.length === 0 || (selectedPropertyTypes.length === 0 && selectedLocations.length === 0)) {
      return mockProperties.slice(0, 4);
    }

    // Return up to 4 recommendations
    return filteredProperties.slice(0, 4);
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

  const handleSaveAndContinue = () => {
    // Save user preferences to backend/localStorage
    const userPreferences = {
      propertyTypes: selectedPropertyTypes,
      locations: selectedLocations,
      completed: true
    };
    
    localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
    
    // Show property recommendations
    setShowRecommendations(true);
  };

  const handleSkip = () => {
    // Mark as completed without preferences
    const userPreferences = {
      propertyTypes: [],
      locations: [],
      completed: true
    };
    
    localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
    
    // Navigate to main dashboard
    navigate('/dashboard/registered');
  };

  const handleContinueToDashboard = () => {
    navigate('/dashboard/registered');
  };

  const handleViewProperty = (propertyId) => {
    navigate(`/dashboard/property-listing/${propertyId}`);
  };

  if (showRecommendations) {
    const recommendations = getPropertyRecommendations();
    
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

            <div className="first-timer-recommendations-grid">
              {recommendations.map((property) => (
                <div key={property.id} className="first-timer-property-card">
                  <div className="first-timer-property-image">
                    <img src={property.image} alt={property.title} />
                    <div className="first-timer-property-type-badge">{property.propertyType}</div>
                  </div>
                  
                  <div className="first-timer-property-content">
                    <h3 className="first-timer-property-title">{property.title}</h3>
                    <p className="first-timer-property-address">{property.address}</p>
                    <div className="first-timer-property-price">{property.price}</div>
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
