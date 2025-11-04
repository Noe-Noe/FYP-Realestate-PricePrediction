import React, { useState, useEffect } from 'react';
import { authAPI, onboardingAPI } from '../../services/api';
import Header from './header';
import Navbar from './navbar';
import Footer from './footer';
import './preferences.css';

const Preferences = () => {
  const [activeTab, setActiveTab] = useState('preferences');
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  // Property types and locations (same as FirstTimer)
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
    { id: 'General', name: 'General Singapore Areas', icon: '🇸🇬' }
  ];

  // Load user preferences on component mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoading(true);
        const response = await onboardingAPI.getUserPreferences();
        setSelectedPropertyTypes(response.propertyTypes || []);
        setSelectedLocations(response.locations || []);
      } catch (error) {
        console.error('Error loading preferences:', error);
        setSaveError('Failed to load preferences. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

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

  const handleSavePreferences = async () => {
    try {
      setIsSaving(true);
      setSaveMessage('');
      setSaveError('');

      const preferences = {
        propertyTypes: selectedPropertyTypes,
        locations: selectedLocations
      };

      await onboardingAPI.saveUserPreferences(preferences);

      setSaveMessage('Preferences saved successfully!');
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);

    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveError('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="user-dashboard">
        <Header />
        <div className="user-dashboard-container">
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="user-main-content">
            <div className="preferences-loading">
              <p>Loading your preferences...</p>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      {/* Top Header */}
      <Header />

      <div className="user-dashboard-container">
        {/* Left Sidebar */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content */}
        <main className="user-main-content">
          <section className="preferences-section">
            <h1 className="preferences-title">Preferences</h1>

            {/* Success/Error Messages */}
            {saveMessage && (
              <div className="preferences-success-message">
                {saveMessage}
              </div>
            )}
            {saveError && (
              <div className="preferences-error-message">
                {saveError}
              </div>
            )}

            {/* Preferred Property Type */}
            <div className="preferences-form-group">
              <label className="preferences-label">Preferred Property Type</label>
              <div className="preferences-select-container">
                <div className="preferences-options-grid">
                  {propertyTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      className={`preferences-option ${selectedPropertyTypes.includes(type.id) ? 'selected' : ''}`}
                      onClick={() => togglePropertyType(type.id)}
                    >
                      <span className="preferences-option-icon">{type.icon}</span>
                      <span className="preferences-option-name">{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preferred Locations */}
            <div className="preferences-form-group">
              <label className="preferences-label">Preferred Locations</label>
              <div className="preferences-select-container">
                <div className="preferences-options-grid">
                  {locationPreferences.map((location) => (
                    <button
                      key={location.id}
                      type="button"
                      className={`preferences-option ${selectedLocations.includes(location.id) ? 'selected' : ''}`}
                      onClick={() => toggleLocation(location.id)}
                    >
                      <span className="preferences-option-icon">{location.icon}</span>
                      <span className="preferences-option-name">{location.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="preferences-actions">
              <button
                className="preferences-save-btn"
                onClick={handleSavePreferences}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Preferences;

