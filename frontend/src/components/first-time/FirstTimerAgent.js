import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../sharedpages/header';
import Footer from '../sharedpages/footer';
import './FirstTimerAgent.css';

const FirstTimerAgent = () => {
  const navigate = useNavigate();
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [userName, setUserName] = useState('Sarah'); // In real app, get from auth context

  // Singapore postal districts and regions data
  const regions = [
    { id: 1, district: '01', sector: '01-06', location: 'CBD' },
    { id: 2, district: '09', sector: '22-27', location: 'Orchard' },
    { id: 3, district: '22', sector: '07-12', location: 'Jurong East' },
    { id: 4, district: '02', sector: '08-14', location: 'Sentosa' },
    { id: 5, district: '03', sector: '15-20', location: 'Queenstown' },
    { id: 6, district: '04', sector: '21-26', location: 'Harbourfront' },
    { id: 7, district: '05', sector: '27-32', location: 'Pasir Panjang' },
    { id: 8, district: '06', sector: '33-38', location: 'Bukit Timah' },
    { id: 9, district: '07', sector: '39-44', location: 'Toa Payoh' },
    { id: 10, district: '08', sector: '45-50', location: 'Serangoon' }
  ];

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

  const handleSaveRegions = () => {
    if (selectedRegions.length === 0) {
      alert('Please select at least one region.');
      return;
    }
    
    // Save agent regions to localStorage
    const agentRegionsData = {
      regions: selectedRegions,
      completed: true,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('agentRegions', JSON.stringify(agentRegionsData));
    
    // Here you would typically save to backend/database
    console.log('Saving selected regions:', selectedRegions);
    
    // Show success message and redirect to agent dashboard
    alert('Regions saved successfully! Redirecting to dashboard...');
    
    // Redirect to agent dashboard
    navigate('/dashboard/agent');
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
                    <th>Postal Sector</th>
                    <th>General Location</th>
                    <th>Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.map((region) => (
                    <tr key={region.id} className={selectedRegions.includes(region.id) ? 'first-timer-agent-selected-row' : ''}>
                      <td>{region.district}</td>
                      <td>{region.sector}</td>
                      <td>{region.location}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedRegions.includes(region.id)}
                          onChange={() => handleRegionToggle(region.id)}
                          className="first-timer-agent-region-checkbox"
                        />
                        <span className="first-timer-agent-assignment-status">
                          {selectedRegions.includes(region.id) ? 'Assigned' : 'Not Assigned'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Button */}
          <div className="first-timer-agent-action-section">
            <button 
              className="first-timer-agent-save-btn"
              onClick={handleSaveRegions}
              disabled={selectedRegions.length === 0}
            >
              Save Regions & Continue
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FirstTimerAgent;
