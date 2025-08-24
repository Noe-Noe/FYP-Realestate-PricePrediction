import React, { useState, useEffect } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './agent-common.css';
import './AgentRegions.css';

const AgentRegions = () => {
  const [activeTab, setActiveTab] = useState('regions');
  const [selectedRegions, setSelectedRegions] = useState([]);

  // Singapore postal districts data
  const regionsData = [
    { id: 1, district: '01', sector: '01-06', location: 'Central Business District', assigned: true },
    { id: 2, district: '02', sector: '07-12', location: 'Chinatown', assigned: false },
    { id: 3, district: '03', sector: '13-18', location: 'Queenstown', assigned: false },
    { id: 4, district: '04', sector: '19-24', location: 'Sentosa', assigned: false },
    { id: 5, district: '05', sector: '25-30', location: 'Buona Vista', assigned: false },
    { id: 6, district: '06', sector: '31-36', location: 'City Hall', assigned: false },
    { id: 7, district: '07', sector: '37-42', location: 'Bugis', assigned: false },
    { id: 8, district: '08', sector: '43-48', location: 'Little India', assigned: false },
    { id: 9, district: '09', sector: '49-54', location: 'Orchard Road', assigned: true },
    { id: 10, district: '10', sector: '55-60', location: 'Tanglin', assigned: false }
  ];

  useEffect(() => {
    // Initialize selected regions from localStorage or default to currently assigned ones
    const savedRegions = localStorage.getItem('agentRegions');
    if (savedRegions) {
      const parsed = JSON.parse(savedRegions);
      if (parsed.regions && parsed.regions.length > 0) {
        setSelectedRegions(parsed.regions);
      } else {
        // Default to currently assigned regions
        const assignedRegions = regionsData.filter(region => region.assigned).map(region => region.id);
        setSelectedRegions(assignedRegions);
      }
    } else {
      // Default to currently assigned regions
      const assignedRegions = regionsData.filter(region => region.assigned).map(region => region.id);
      setSelectedRegions(assignedRegions);
    }
  }, []);

  const handleRegionToggle = (regionId) => {
    setSelectedRegions(prev => {
      if (prev.includes(regionId)) {
        return prev.filter(id => id !== regionId);
      } else {
        // Check if we're at the maximum limit
        if (prev.length >= 3) {
          alert('You can select a maximum of 3 regions.');
          return prev;
        }
        return [...prev, regionId];
      }
    });
  };

  const handleSaveChanges = () => {
    if (selectedRegions.length === 0) {
      alert('Please select at least one region.');
      return;
    }
    
    const agentRegionsData = {
      regions: selectedRegions,
      completed: true,
      savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('agentRegions', JSON.stringify(agentRegionsData));
    alert('Regions saved successfully!');
  };

  const getCurrentRegionsText = () => {
    const currentRegions = regionsData.filter(region => selectedRegions.includes(region.id));
    if (currentRegions.length === 0) return 'No regions assigned';
    
    return currentRegions.map(region => 
      `District ${region.district} (${region.location})`
    ).join(', ');
  };

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          <div className="user-content-header">
            <h1 className="user-main-title">Manage Assigned Regions</h1>
          </div>
          
          <div className="agent-regions-content">
            {/* Current Regions Section */}
            <section className="agent-regions-current-regions-section">
              <h2 className="agent-regions-section-title">Your Current Regions:</h2>
              <p className="agent-regions-regions-text">
                Assigned Regions: {getCurrentRegionsText()}
              </p>
            </section>

            {/* Region Selection Table */}
            <section className="agent-regions-selection-section">
              <h2 className="agent-regions-section-title">Select Your Regions (Max 3)</h2>
              <div className="agent-regions-table-container">
                <table className="agent-regions-table">
                  <thead>
                    <tr>
                      <th>Postal District</th>
                      <th>Postal Sector</th>
                      <th>General Location</th>
                      <th>Assigned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionsData.map((region) => (
                      <tr key={region.id} className={selectedRegions.includes(region.id) ? 'agent-regions-selected-row' : ''}>
                        <td>{region.district}</td>
                        <td>{region.sector}</td>
                        <td>{region.location}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedRegions.includes(region.id)}
                            onChange={() => handleRegionToggle(region.id)}
                            className="agent-regions-checkbox"
                          />
                          <span className="agent-regions-assignment-status">
                            {selectedRegions.includes(region.id) ? 'Assigned' : 'Not Assigned'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Save Button */}
            <section className="agent-regions-save-section">
              <button 
                className="agent-regions-save-btn"
                onClick={handleSaveChanges}
                disabled={selectedRegions.length === 0}
              >
                Save Changes
              </button>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AgentRegions;
