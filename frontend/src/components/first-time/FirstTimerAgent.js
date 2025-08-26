import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../sharedpages/header';
import Footer from '../sharedpages/footer';
import { onboardingAPI, agentAPI } from '../../services/api';
import './FirstTimerAgent.css';

const FirstTimerAgent = () => {
  const navigate = useNavigate();
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [userName, setUserName] = useState('Agent'); // Will be updated from auth context
  const [isSaving, setIsSaving] = useState(false);

  // Singapore postal districts data - same as AgentRegions
  const regionsData = [
    { id: 1, district: '01', sector: '01, 02, 03, 04, 05, 06', location: 'Raffles Place, Cecil, Marina, People\'s Park' },
    { id: 2, district: '02', sector: '07, 08', location: 'Anson, Tanjong Pagar' },
    { id: 3, district: '03', sector: '14, 15, 16', location: 'Queenstown, Tiong Bahru' },
    { id: 4, district: '04', sector: '09, 10', location: 'Telok Blangah, Harbourfront' },
    { id: 5, district: '05', sector: '11, 12, 13', location: 'Pasir Panjang, Hong Leong Garden, Clementi New Town' },
    { id: 6, district: '06', sector: '17', location: 'High Street, Beach Road (part)' },
    { id: 7, district: '07', sector: '18, 19', location: 'Middle Road, Golden Mile' },
    { id: 8, district: '08', sector: '20, 21', location: 'Little India' },
    { id: 9, district: '09', sector: '22, 23', location: 'Orchard, Cairnhill, River Valley' },
    { id: 10, district: '10', sector: '24, 25, 26, 27', location: 'Ardmore, Bukit Timah, Holland Road, Tanglin' },
    { id: 11, district: '11', sector: '28, 29, 30', location: 'Watten Estate, Novena, Thomson' },
    { id: 12, district: '12', sector: '31, 32, 33', location: 'Balestier, Toa Payoh, Serangoon' },
    { id: 13, district: '13', sector: '34, 35, 36, 37', location: 'Macpherson, Braddell' },
    { id: 14, district: '14', sector: '38, 39, 40, 41', location: 'Geylang, Eunos' },
    { id: 15, district: '15', sector: '42, 43, 44, 45', location: 'Katong, Joo Chiat, Amber Road' },
    { id: 16, district: '16', sector: '46, 47, 48', location: 'Bedok, Upper East Coast, Eastwood, Kew Drive' },
    { id: 17, district: '17', sector: '49, 50, 81', location: 'Loyang, Changi' },
    { id: 18, district: '18', sector: '51, 52', location: 'Tampines, Pasir Ris' },
    { id: 19, district: '19', sector: '53, 54, 55, 82', location: 'Serangoon Garden, Hougang, Punggol' },
    { id: 20, district: '20', sector: '56, 57', location: 'Bishan, Ang Mo Kio' },
    { id: 21, district: '21', sector: '58, 59', location: 'Upper Bukit Timah, Clementi Park, Ulu Pandan' },
    { id: 22, district: '22', sector: '60, 61, 62, 63, 64', location: 'Jurong' },
    { id: 23, district: '23', sector: '65, 66, 67, 68', location: 'Hillview, Dairy Farm, Bukit Panjang, Choa Chu Kang' },
    { id: 24, district: '24', sector: '69, 70, 71', location: 'Lim Chu Kang, Tengah' },
    { id: 25, district: '25', sector: '72, 73', location: 'Kranji, Woodgrove' },
    { id: 26, district: '26', sector: '77, 78', location: 'Upper Thomson, Springleaf' },
    { id: 27, district: '27', sector: '75, 76', location: 'Yishun, Sembawang' },
    { id: 28, district: '28', sector: '79, 80', location: 'Seletar' }
  ];

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
      // Get the selected region data in the format expected by the backend
      const selectedRegionData = selectedRegions.map(id => {
        const region = regionsData.find(r => r.id === id);
        return {
          region_name: `District ${region.district}`,
          region_type: 'district',
          region_value: region.location
        };
      });
      
      // Save agent regions to the database
      await agentAPI.updateAssignedRegions(selectedRegionData);
      
      // Save agent regions to localStorage as backup
      const agentRegionsData = {
        regions: selectedRegions,
        completed: true,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('agentRegions', JSON.stringify(agentRegionsData));
      
      // Mark agent onboarding as completed in backend
      await onboardingAPI.completeAgent();
      
      // Show success message and redirect to agent dashboard
      alert(`Regions saved successfully to database! You have been assigned to ${selectedRegions.length} region(s). Redirecting to dashboard...`);
      
      // Redirect to agent dashboard
      navigate('/dashboard/agent');
    } catch (error) {
      console.error('Error saving agent regions:', error);
      
      // Try to save to localStorage as fallback
      try {
        const agentRegionsData = {
          regions: selectedRegions,
          completed: true,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('agentRegions', JSON.stringify(agentRegionsData));
        
        // Still try to mark onboarding as completed
        await onboardingAPI.completeAgent();
        
        alert('Regions saved locally due to database error. Redirecting to dashboard...');
        navigate('/dashboard/agent');
      } catch (fallbackError) {
        console.error('Fallback save also failed:', fallbackError);
        alert('Error saving regions. Please try again or contact support.');
      } finally {
        setIsSaving(false);
      }
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
                  {regionsData.map((region) => (
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
                  ))}
                </tbody>
              </table>
            </div>

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
