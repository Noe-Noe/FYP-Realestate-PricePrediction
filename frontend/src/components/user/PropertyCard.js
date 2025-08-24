import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PropertyCard.css';

const PropertyCard = ({ 
  property, 
  comparisonData, 
  activeMapTab, 
  onMapTabChange, 
  mapId,
  showVS = false,
  // Amenities props
  amenities = [],
  selectedAmenityTypes = [],
  onToggleAmenity = () => {},
  isLoadingAmenities = false,
  amenitiesError = '',
  amenityOptions = []
}) => {
  const navigate = useNavigate();

  const handleSeeMoreClick = () => {
    navigate('/dashboard/property-listings');
  };
  return (
    <div className="property-card-container">
      <h2 className="property-card-title">{property?.address}</h2>
      
      {/* Estimated Prices */}
      <div className="property-card-price-section">
        <div className="property-card-price-item">
          <div className="property-card-price-info">
            <h3>Estimated Sales Price</h3>
            <div className="property-card-price-value">{comparisonData?.estimatedSalesPrice}</div>
          </div>
          <div className="property-card-price-image">🏭</div>
        </div>
        <div className="property-card-price-item">
          <div className="property-card-price-info">
            <h3>Estimated Rental Price</h3>
            <div className="property-card-price-value">{comparisonData?.estimatedRentalPrice}</div>
          </div>
          <div className="property-card-price-image">🏭</div>
        </div>
      </div>

      {/* Property Details Summary */}
      <div className="property-card-details-section">
        <h3>Property Details Summary</h3>
        <div className="property-card-details-grid">
          <div className="property-card-detail-item">
            <span className="property-card-detail-label">Property Type:</span>
            <span className="property-card-detail-value">{comparisonData?.propertyType}</span>
          </div>
          <div className="property-card-detail-item">
            <span className="property-card-detail-label">Floor Area:</span>
            <span className="property-card-detail-value">{comparisonData?.floorArea} sq ft</span>
          </div>
          <div className="property-card-detail-item">
            <span className="property-card-detail-label">Tenure:</span>
            <span className="property-card-detail-value">{comparisonData?.tenure}</span>
          </div>
          <div className="property-card-detail-item">
            <span className="property-card-detail-label">Level:</span>
            <span className="property-card-detail-value">{comparisonData?.level || 'N/A'}</span>
          </div>
          <div className="property-card-detail-item">
            <span className="property-card-detail-label">Other Details:</span>
            <span className="property-card-detail-value">{comparisonData?.otherDetails || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Market Trends */}
      <div className="property-card-market-trend-section">
        <h3>Market Trends</h3>
        <div className="property-card-trend-subtitle">Property Sales Price Trends</div>
        <div className="property-card-trend-header">
          <div className="property-card-trend-percentage">{comparisonData?.marketTrend}</div>
          <div className="property-card-trend-period">{comparisonData?.marketTrendPeriod}</div>
        </div>
        <div className="property-card-trend-chart">
          <svg width="100%" height="100%" viewBox="0 0 200 60">
            <polyline
              points="20,36 60,30 100,24 140,18 180,12"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            />
            <circle cx="20" cy="36" r="3" fill="#3b82f6" />
            <circle cx="60" cy="30" r="3" fill="#3b82f6" />
            <circle cx="100" cy="24" r="3" fill="#3b82f6" />
            <circle cx="140" cy="18" r="3" fill="#3b82f6" />
            <circle cx="180" cy="12" r="3" fill="#3b82f6" />
          </svg>
        </div>
      </div>

      {/* Similar Properties Transactions */}
      <div className="property-card-transactions-section">
        <h3>Similar Properties Transactions</h3>
        <div className="property-card-transactions-table">
          <div className="property-card-table-header">
            <div className="property-card-table-cell">Address</div>
            <div className="property-card-table-cell">Property Type</div>
            <div className="property-card-table-cell">Size</div>
            <div className="property-card-table-cell">Sales Date</div>
            <div className="property-card-table-cell">Sales Price</div>
          </div>
          {comparisonData?.historicalTransactions?.map((transaction, index) => (
            <div key={index} className="property-card-table-row">
              <div className="property-card-table-cell">{transaction.address}</div>
              <div className="property-card-table-cell">{transaction.type}</div>
              <div className="property-card-table-cell">{transaction.area}</div>
              <div className="property-card-table-cell">{transaction.date}</div>
              <div className="property-card-table-cell">{transaction.price}</div>
            </div>
          ))}
        </div>
        <div className="property-card-see-more">See More</div>
      </div>

      {/* Price Statistics */}
      <div className="property-card-price-stats">
        <div className="property-card-stat-item">
          <div className="property-card-stat-content">
            <div className="property-card-stat-label">Median Sale Price:</div>
            <div className="property-card-stat-description">The median sale price for retail properties around {property?.address} is {comparisonData?.medianSalePrice}.</div>
          </div>
        </div>
        <div className="property-card-stat-item">
          <div className="property-card-stat-content">
            <div className="property-card-stat-label">Highest Sold Price:</div>
            <div className="property-card-stat-description">{comparisonData?.highestSoldPriceDescription || 'Details of the highest recorded sale price for a comparable property.'}</div>
          </div>
        </div>
      </div>

      {/* Location Map */}
      <div className="property-card-location-section">
        <h3>Location Map</h3>
        <div className="property-card-map-tabs">
          <button 
            className={`property-card-map-tab ${activeMapTab === 'onemap' ? 'active' : ''}`}
            onClick={() => onMapTabChange('onemap')}
          >
            OneMap
          </button>
          <button 
            className={`property-card-map-tab ${activeMapTab === 'ura' ? 'active' : ''}`}
            onClick={() => onMapTabChange('ura')}
          >
            Masterplan Map
          </button>
          <button 
            className={`property-card-map-tab ${activeMapTab === 'google' ? 'active' : ''}`}
            onClick={() => onMapTabChange('google')}
          >
            Maps
          </button>
        </div>
        <div id={mapId} className="property-card-map-container"></div>
        
        {/* Nearby Amenities Panel */}
        {amenityOptions.length > 0 && (
          <div className="property-card-amenities-panel">
            <div className="property-card-amenities-header">
              <h3>Nearby Amenities</h3>
              <div className="property-card-amenity-filters">
                {amenityOptions.map((opt) => (
                  <button 
                    key={opt.type}
                    type="button" 
                    className={`property-card-amenity-chip ${selectedAmenityTypes.includes(opt.type) ? 'active' : ''}`}
                    onClick={() => onToggleAmenity(opt.type)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {isLoadingAmenities && (
              <div className="property-card-amenities-loading">Loading amenities…</div>
            )}
            {amenitiesError && (
              <div className="property-card-amenities-error">{amenitiesError}</div>
            )}

            {!isLoadingAmenities && !amenitiesError && amenities.length === 0 && (
              <div className="property-card-amenities-empty">No amenities found for the selected filters.</div>
            )}

            {!isLoadingAmenities && amenities.length > 0 && (
              <ul className="property-card-amenities-list">
                {amenities.map((a) => (
                  <li className="property-card-amenity-item" key={a.id}>
                    <div className="property-card-amenity-main">
                      <div className="property-card-amenity-name">{a.name}</div>
                      {a.vicinity && <div className="property-card-amenity-address">{a.vicinity}</div>}
                    </div>
                    <div className="property-card-amenity-meta">
                      {typeof a.rating === 'number' && (
                        <span className="property-card-amenity-rating">★ {a.rating.toFixed(1)}</span>
                      )}
                      {typeof a.distance === 'number' && (
                        <span className="property-card-amenity-distance">{Math.round(a.distance)} m</span>
                      )}
                      <a
                        className="property-card-amenity-link"
                        href={`https://www.google.com/maps/place/?q=place_id:${a.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open in Maps
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Properties Listing */}
      <div className="property-card-listings-section">
        <h3>Properties Listing</h3>
        <div className="property-card-listings-table">
                     <div className="property-card-table-header">
             <div className="property-card-table-cell">Address</div>
             <div className="property-card-table-cell">Property Type</div>
             <div className="property-card-table-cell">Size</div>
             <div className="property-card-table-cell">Price</div>
             <div className="property-card-table-cell">Action</div>
           </div>
                     {comparisonData?.activeListings?.map((listing, index) => (
             <div key={index} className="property-card-table-row">
               <div className="property-card-table-cell">{listing.address}</div>
               <div className="property-card-table-cell">{listing.type}</div>
               <div className="property-card-table-cell">{listing.area}</div>
               <div className="property-card-table-cell">{listing.price}</div>
               <div className="property-card-table-cell">
                 <button 
                   className="property-card-view-details-btn"
                   onClick={() => navigate(`/dashboard/property-listing/${listing.id || index + 1}`)}
                 >
                   View Details
                 </button>
               </div>
             </div>
           ))}
        </div>
        <div className="property-card-see-more" onClick={handleSeeMoreClick}>See More</div>
      </div>

      {/* Contact Agents */}
      <div className="property-card-agents-section">
        <h3>Contact Agents</h3>
        <div className="property-card-agents-note">No agent information available for this property N/A.</div>
        <div className="property-card-agents-list">
          {comparisonData?.agents?.map((agent, index) => (
            <div key={index} className="property-card-agent-item">
              <div className="property-card-agent-avatar">{agent.image}</div>
              <div className="property-card-agent-info">
                <div className="property-card-agent-name">{agent.name}</div>
                <div className="property-card-agent-title">{agent.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
