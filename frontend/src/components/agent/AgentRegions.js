import React, { useState, useEffect } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import { agentAPI, authAPI } from '../../services/api';
import './agent-common.css';
import './AgentRegions.css';

const AgentRegions = () => {
  const [activeTab, setActiveTab] = useState('regions');
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regionsData, setRegionsData] = useState([]);

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
        setRegionsData([]);
      }
    };
    loadRegions();
  }, []);

  useEffect(() => {
    const loadAgentRegions = async () => {
      try {
        setLoading(true);
        const response = await agentAPI.getAssignedRegions();
        
        // Extract regions from response (backend returns {regions: [...]})
        const regions = response.regions || response;
        
        // Check if regions is an array
        if (!regions || !Array.isArray(regions)) {
          setSelectedRegions([]);
          return;
        }
        
        // Map backend region data to frontend region IDs
        const regionValueToId = {
          'Raffles Place, Cecil, Marina, People\'s Park': 1,
          'Anson, Tanjong Pagar': 2,
          'Queenstown, Tiong Bahru': 3,
          'Telok Blangah, Harbourfront': 4,
          'Pasir Panjang, Hong Leong Garden, Clementi New Town': 5,
          'High Street, Beach Road (part)': 6,
          'Middle Road, Golden Mile': 7,
          'Little India': 8,
          'Orchard, Cairnhill, River Valley': 9,
          'Ardmore, Bukit Timah, Holland Road, Tanglin': 10,
          'Watten Estate, Novena, Thomson': 11,
          'Balestier, Toa Payoh, Serangoon': 12,
          'Macpherson, Braddell': 13,
          'Geylang, Eunos': 14,
          'Katong, Joo Chiat, Amber Road': 15,
          'Bedok, Upper East Coast, Eastwood, Kew Drive': 16,
          'Loyang, Changi': 17,
          'Tampines, Pasir Ris': 18,
          'Serangoon Garden, Hougang, Punggol': 19,
          'Bishan, Ang Mo Kio': 20,
          'Upper Bukit Timah, Clementi Park, Ulu Pandan': 21,
          'Jurong': 22,
          'Hillview, Dairy Farm, Bukit Panjang, Choa Chu Kang': 23,
          'Lim Chu Kang, Tengah': 24,
          'Kranji, Woodgrove': 25,
          'Upper Thomson, Springleaf': 26,
          'Yishun, Sembawang': 27,
          'Seletar': 28
        };
        
        const assignedRegionIds = [];
        regions.forEach(region => {
          const mappedId = regionValueToId[region.region_value];
          if (mappedId) {
            assignedRegionIds.push(mappedId);
          }
        });
        
        setSelectedRegions(assignedRegionIds);
      } catch (error) {
        setError('Failed to load assigned regions');
      } finally {
        setLoading(false);
      }
    };

    loadAgentRegions();
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

  const handleSaveChanges = async () => {
    if (selectedRegions.length === 0) {
      alert('Please select at least one region.');
      return;
    }
    
    try {
      await agentAPI.updateAssignedRegions(selectedRegions);
      console.log(`Successfully saved ${selectedRegions.length} region(s)`);
      // Reload the page to refresh the assigned regions display
      window.location.reload();
    } catch (error) {
      console.error('Error saving regions:', error);
      const errorMessage = error.message || 'Error saving regions. Please try again.';
      alert(`Failed to save regions: ${errorMessage}`);
    }
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
            {loading && (
              <div className="agent-regions-loading">
                <div className="loading-spinner"></div>
                <p>Loading your assigned regions...</p>
              </div>
            )}
            
            {error && (
              <div className="agent-regions-error">
                <p>Error: {error}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
              </div>
            )}
            
            {!loading && !error && (
              <>
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
                          ))
                        )}
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
              </>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AgentRegions;
