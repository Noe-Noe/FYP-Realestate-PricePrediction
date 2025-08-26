import React, { useState, useEffect } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import { agentAPI } from '../../services/api';
import './agent-common.css';
import './AgentRegions.css';

const AgentRegions = () => {
  const [activeTab, setActiveTab] = useState('regions');
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Singapore postal districts data
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
      alert('Regions saved successfully!');
    } catch (error) {
      alert('Error saving regions. Please try again.');
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
