import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../sharedpages/header';
import Footer from '../sharedpages/footer';
import { onboardingAPI, agentAPI, authAPI } from '../../services/api';
import './FirstTimerAgent.css';

const FirstTimerAgent = () => {
  const navigate = useNavigate();
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [userName, setUserName] = useState('Agent'); // Will be updated from auth context
  const [isSaving, setIsSaving] = useState(false);
  const [regionsData, setRegionsData] = useState([]);
  const [regionsLoading, setRegionsLoading] = useState(true);

  // Fetch regions from the backend
  useEffect(() => {
    const loadRegions = async () => {
      try {
        const response = await authAPI.getAllRegions();
        if (response.regions) {
          // Map backend regions to the format expected by the frontend
          const mappedRegions = response.regions.filter(r => r.is_active).map(region => ({
            id: region.id,
            district: region.district,
            sector: region.sector,
            location: region.location
          }));
          setRegionsData(mappedRegions);
        }
      } catch (error) {
        console.error('Error loading regions:', error);
        // Fallback to empty array or handle error
        setRegionsData([]);
      } finally {
        setRegionsLoading(false);
      }
    };
    loadRegions();
  }, []);

  // Get user name from localStorage or auth context
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      navigate('/login');
      return;
    }
    
    if (userType !== 'agent') {
      navigate('/dashboard');
      return;
    }
    
    // Try to get user name from localStorage or use default
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.full_name) {
          setUserName(userData.full_name);
        }
      } catch (error) {
        console.log('Could not parse stored user data');
      }
    }
  }, [navigate]);

  const handleRegionToggle = (regionId) => {
    setSelectedRegions(prev => {
      if (prev.includes(regionId)) {
        return prev.filter(id => id !== regionId);
      } else {
        // Check if already at max limit
        if (prev.length >= 3) {
          alert('You can select a maximum of 3 regions.');
          return prev;
        }
        return [...prev, regionId];
      }
    });
  };

  const handleSaveRegions = async () => {
    if (selectedRegions.length === 0) {
      alert('Please select at least one region.');
      return;
    }
    
    setIsSaving(true);
    try {
      // Send just the IDs to the backend
      await agentAPI.updateAssignedRegions(selectedRegions);
      console.log('Regions saved successfully');
      
      // Save agent regions to localStorage as backup
      const agentRegionsData = {
        regions: selectedRegions,
        completed: true,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('agentRegions', JSON.stringify(agentRegionsData));
      
      // Try to mark agent onboarding as completed in backend
      try {
        await onboardingAPI.completeAgent();
        console.log('Agent onboarding marked as complete');
      } catch (onboardingError) {
        console.error('Failed to mark onboarding as complete:', onboardingError);
        // This is not critical - the regions are saved, continue anyway
      }
      
      console.log(`Successfully saved ${selectedRegions.length} region(s). Redirecting to dashboard...`);
      
      // Redirect to agent dashboard
      navigate('/dashboard/agent');
    } catch (error) {
      console.error('Error saving agent regions:', error);
      
      // Show specific error message from backend
      const errorMessage = error.message || 'Failed to save regions.';
      alert(`Error: ${errorMessage}. Please try again or contact support.`);
      
      setIsSaving(false);
    }
  };

  return (
    <div className="first-timer-agent-container">
      <Header />
      
      <main className="first-timer-agent-main-content">
        <div className="first-timer-agent-content-container">
          {/* Page Title */}
          <div className="first-timer-agent-page-header">
            <h1 className="first-timer-agent-main-title">Welcome, {userName}! Select Your Assigned Regions</h1>
            <p className="first-timer-agent-instructions">
              To help us connect you with clients and properties in your areas of expertise, please select up to 3 regions.
            </p>
          </div>

          {/* Region Selection Table */}
          <div className="first-timer-agent-region-selection">
            {regionsLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p>Loading regions...</p>
              </div>
            ) : (
              <div className="first-timer-agent-table-container">
                <table className="first-timer-agent-regions-table">
                  <thead>
                    <tr>
                      <th>Postal District</th>
                      <th>Postal Sectors</th>
                      <th>General Location</th>
                      <th>Assigned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionsData.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                          No regions available. Please contact support.
                        </td>
                      </tr>
                    ) : (
                      regionsData.map((region) => (
                        <tr key={region.id} className={selectedRegions.includes(region.id) ? 'first-timer-agent-selected-row' : ''}>
                          <td>{region.district}</td>
                          <td>{region.sector}</td>
                          <td>{region.location}</td>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedRegions.includes(region.id)}
                              onChange={() => handleRegionToggle(region.id)}
                              className="first-timer-agent-checkbox"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Selected Regions Summary */}
            {selectedRegions.length > 0 && (
              <div className="first-timer-agent-selected-summary">
                <h3>Selected Regions ({selectedRegions.length}/3):</h3>
                <div className="first-timer-agent-selected-list">
                  {selectedRegions.map(id => {
                    const region = regionsData.find(r => r.id === id);
                    return (
                      <div key={id} className="first-timer-agent-selected-item">
                        <span className="first-timer-agent-district">District {region.district}</span>
                        <span className="first-timer-agent-location">{region.location}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="first-timer-agent-action-buttons">
              <button 
                className="first-timer-agent-save-btn"
                onClick={handleSaveRegions}
                disabled={selectedRegions.length === 0 || isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="first-timer-agent-loading-spinner"></span>
                    Saving...
                  </>
                ) : (
                  'Save Regions & Continue'
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FirstTimerAgent;
