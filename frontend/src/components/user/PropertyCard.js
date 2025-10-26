import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { propertiesAPI, predictionAPI } from '../../services/api';
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
  amenityOptions = [],
  // ML prediction data passed from parent components
  mlPredictionData: parentMlPredictionData = null
}) => {
  const navigate = useNavigate();
  
  // State for nearby properties
  const [nearbyProperties, setNearbyProperties] = useState([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [nearbyError, setNearbyError] = useState('');
  
  // State for region agents
  const [regionAgents, setRegionAgents] = useState([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [agentsError, setAgentsError] = useState('');

  // State for ML predictions
  const [mlPredictionData, setMlPredictionData] = useState(parentMlPredictionData);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [predictionError, setPredictionError] = useState('');
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  
  // Debounce timer for API calls
  const [debounceTimer, setDebounceTimer] = useState(null);
  
  // Show basic property data immediately
  const [showBasicData, setShowBasicData] = useState(true);
  
  // Sorting state for similar properties transactions
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // Update ML prediction data when parent data changes
  useEffect(() => {
    if (parentMlPredictionData) {
      setMlPredictionData(parentMlPredictionData);
    }
  }, [parentMlPredictionData]);

  // Generate ML prediction when property data is available (with debouncing)
  // Only run if no parent ML prediction data is provided
  useEffect(() => {
    // Skip if parent ML prediction data is provided
    if (parentMlPredictionData) {
      return;
    }
    
    // Clear any existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set a new timer to debounce the API call
    const timer = setTimeout(async () => {
      // Only generate prediction if we have the required property data
      if (!property?.address || !property?.propertyType || !property?.floorArea) {
        return;
      }
      
      // Don't generate if we already have prediction data
      if (mlPredictionData) {
        return;
      }
      
      // Check if user is authenticated
      const token = localStorage.getItem('accessToken');
      const useTestEndpoint = !token;
      
      // Set loading state for spinner
      setIsLoadingPrediction(true);
      setPredictionError('');
      
      try {
        // Prepare property data for ML prediction
        const propertyData = {
          propertyType: property.propertyType,
          address: property.address,
          floorArea: property.floorArea,
          level: property.level || 'Ground Floor',
          unit: property.unit || 'N/A'
        };
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for ML processing
        
        // Call the appropriate ML prediction API with timeout
        const response = useTestEndpoint 
          ? await predictionAPI.predictPriceTest(propertyData, { signal: controller.signal })
          : await predictionAPI.predictPrice(propertyData, { signal: controller.signal });
        
        clearTimeout(timeoutId);
        
        if (response.success) {
          setMlPredictionData({
            property_data: response.property_data,
            comparison_data: response.comparison_data,
            matched_address: response.matched_address
          });
        } else {
          setPredictionError('Failed to generate prediction');
        }
      } catch (error) {
        // Handle specific error types
        if (error.name === 'AbortError') {
          // Provide fast fallback data when ML prediction times out
          setMlPredictionData({
            property_data: {
              address: property.address,
              propertyType: property.propertyType,
              floorArea: property.floorArea,
              level: property.level || 'Ground Floor',
              unit: property.unit || 'N/A'
            },
            comparison_data: {
              estimatedSalesPrice: 'Loading...',
              estimatedRentalPrice: 'Loading...',
              marketTrend: '+0%',
              marketTrendPeriod: '12 months',
              medianSalePrice: 'Loading...',
              highestSoldPriceDescription: 'Loading market data...',
              historicalTransactions: []
            },
            matched_address: property.address
          });
          setPredictionError('AI prediction timed out. Using fallback data.');
        } else if (error.message.includes('Invalid token') || error.message.includes('Token expired')) {
          setPredictionError('Please log in to get AI-powered predictions');
        } else if (error.message.includes('Authorization token required')) {
          setPredictionError('Please log in to get AI-powered predictions');
        } else {
          setPredictionError('AI prediction temporarily unavailable: ' + (error.message || 'Unknown error'));
        }
      } finally {
        setIsLoadingPrediction(false);
      }
    }, 300); // 300ms debounce delay
    
    setDebounceTimer(timer);
    
    // Cleanup function
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [property?.address, property?.propertyType, property?.floorArea, mlPredictionData, parentMlPredictionData]);

  // Fetch all additional data in parallel when property address changes
  useEffect(() => {
    const fetchAllData = async () => {
      if (!property?.address) return;
      
      // Set loading states
      setIsLoadingNearby(true);
      setIsLoadingAgents(true);
      setNearbyError('');
      setAgentsError('');
      
      try {
        // Run all API calls in parallel
        const [nearbyResponse, agentsResponse] = await Promise.allSettled([
          propertiesAPI.getNearbyProperties(property.address, 5, property.propertyType),
          propertiesAPI.getAgentsByRegion(property.address)
        ]);
        
        // Handle nearby properties response
        if (nearbyResponse.status === 'fulfilled') {
          setNearbyProperties(nearbyResponse.value.nearby_properties || []);
        } else {
          setNearbyError('Failed to load nearby properties');
          setNearbyProperties([]);
        }
        
        // Handle agents response
        if (agentsResponse.status === 'fulfilled') {
          setRegionAgents(agentsResponse.value.agents || []);
        } else {
          setAgentsError('Failed to load agents for this region');
          setRegionAgents([]);
        }
        
      } catch (error) {
        setNearbyError('Failed to load nearby properties');
        setAgentsError('Failed to load agents for this region');
        setNearbyProperties([]);
        setRegionAgents([]);
      } finally {
        setIsLoadingNearby(false);
        setIsLoadingAgents(false);
      }
    };

    fetchAllData();
  }, [property?.address]);

  const handleSeeMoreClick = () => {
    setShowAllTransactions(!showAllTransactions);
  };

  const handleSeeMoreListingsClick = () => {
    navigate('/dashboard/property-listings');
  };

  // Sorting functions for similar properties transactions
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortTransactions = (transactions) => {
    if (!sortConfig.key) return transactions;

    return [...transactions].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle different data types
      if (sortConfig.key === 'floorArea') {
        // Extract numeric value from floor area (e.g., "1500" from "1500 sqft")
        aValue = parseFloat(aValue.toString().replace(/[^\d.]/g, '')) || 0;
        bValue = parseFloat(bValue.toString().replace(/[^\d.]/g, '')) || 0;
      } else if (sortConfig.key === 'price') {
        // Extract numeric value from price (e.g., "$1.5M" -> 1500000)
        aValue = parsePriceToNumber(aValue);
        bValue = parsePriceToNumber(bValue);
      } else if (sortConfig.key === 'unitPricePsf') {
        // Extract numeric value from unit price (e.g., "$5128" -> 5128)
        aValue = parseFloat(aValue.toString().replace(/[^\d.]/g, '')) || 0;
        bValue = parseFloat(bValue.toString().replace(/[^\d.]/g, '')) || 0;
      } else if (sortConfig.key === 'date') {
        // Convert date string to Date object for comparison
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        // String comparison
        aValue = aValue?.toString().toLowerCase() || '';
        bValue = bValue?.toString().toLowerCase() || '';
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const parsePriceToNumber = (priceStr) => {
    if (!priceStr) return 0;
    const str = priceStr.toString().replace(/[$,]/g, '');
    if (str.includes('M')) {
      return parseFloat(str.replace('M', '')) * 1000000;
    } else if (str.includes('k')) {
      return parseFloat(str.replace('k', '')) * 1000;
    } else {
      return parseFloat(str) || 0;
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return '↕️'; // Neutral sort icon
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };
  return (
    <div className="property-card-container">
      <h2 className="property-card-title">
        {property?.address}
        {!mlPredictionData && !predictionError && (
          <span style={{ fontSize: '0.8rem', color: '#6b7280', marginLeft: '10px' }}>
            🔄 Loading AI predictions...
          </span>
        )}
      </h2>
      
      {/* Property Details Summary - Show user input for prediction, property details for comparison */}
      <div className="property-card-details-section">
        <h3>Property Details Summary</h3>
        {!showBasicData ? (
          <div className="property-card-loading">
            <div className="property-card-loading-spinner"></div>
            <p>Loading property details...</p>
          </div>
        ) : (
        <div className="property-card-details-grid">
          <div className="property-card-detail-item">
            <span className="property-card-detail-label">Property Type:</span>
            <span className="property-card-detail-value">{property?.propertyType || comparisonData?.propertyType}</span>
          </div>
          <div className="property-card-detail-item">
            <span className="property-card-detail-label">Floor Area:</span>
            <span className="property-card-detail-value">{property?.floorArea || comparisonData?.floorArea} sq ft</span>
          </div>
          <div className="property-card-detail-item">
            <span className="property-card-detail-label">Level:</span>
            <span className="property-card-detail-value">{property?.level || comparisonData?.level || 'N/A'}</span>
          </div>
          <div className="property-card-detail-item">
            <span className="property-card-detail-label">Unit:</span>
            <span className="property-card-detail-value">{property?.unit || 'N/A'}</span>
          </div>
        </div>
        )}
      </div>
      
      {/* Estimated Prices */}
      <div className="property-card-price-section">
        {isLoadingPrediction ? (
          <div className="property-card-loading">
            <div className="property-card-loading-spinner"></div>
            <p>Generating AI-powered price prediction...</p>
          </div>
        ) : predictionError ? (
          <div className="property-card-error">
            <p>⚠️ {predictionError}</p>
            <p>Using fallback data...</p>
            {predictionError.includes('log in') && (
              <button 
                className="property-card-retry-button"
                onClick={() => {
                  setMlPredictionData(null);
                  setPredictionError('');
                }}
              >
                🔄 Retry After Login
              </button>
            )}
          </div>
        ) : (
          <>
        <div className="property-card-price-item">
          <div className="property-card-price-info">
            <h3>Estimated Sales Price</h3>
                  <div className="property-card-price-value">
                    {mlPredictionData?.comparison_data?.estimatedSalesPrice || comparisonData?.estimatedSalesPrice || 'N/A'}
                  </div>
                  {mlPredictionData && (
                    <div className="property-card-ai-badge">🤖 AI-Powered</div>
                  )}
          </div>
          <div className="property-card-price-image">🏭</div>
        </div>
        <div className="property-card-price-item">
          <div className="property-card-price-info">
            <h3>Estimated Rental Price</h3>
                  <div className="property-card-price-value">
                    {mlPredictionData?.comparison_data?.estimatedRentalPrice || comparisonData?.estimatedRentalPrice || 'N/A'}
                  </div>
                  {mlPredictionData && (
                    <div className="property-card-ai-badge">🤖 AI-Powered</div>
                  )}
          </div>
          <div className="property-card-price-image">🏭</div>
        </div>
          </>
        )}
      </div>



      {/* Market Trends */}
      <div className="property-card-market-trend-section">
        <h3>Market Trends</h3>
        <div className="property-card-trend-subtitle">Property Sales Price Trends</div>
        
        {isLoadingPrediction ? (
          <div className="property-card-loading">
            <div className="property-card-loading-spinner"></div>
            <p>Analyzing market trends...</p>
          </div>
        ) : (
          <>
        <div className="property-card-trend-header">
              <div className="property-card-trend-percentage">
                {mlPredictionData?.comparison_data?.marketTrend || comparisonData?.marketTrend || 'N/A'}
              </div>
              <div className="property-card-trend-period">
                {mlPredictionData?.comparison_data?.marketTrendPeriod || comparisonData?.marketTrendPeriod || 'N/A'}
              </div>
        </div>
        <div className="property-card-trend-chart">
          <svg width="100%" height="100%" viewBox="0 0 450 360">
            {(() => {
              // Get trend data from ML prediction
              const trendValue = mlPredictionData?.comparison_data?.marketTrend || comparisonData?.marketTrend || '+0%';
              const numericTrend = parseFloat(trendValue.replace(/[+%]/g, ''));
              const isPositive = numericTrend > 0;
              const isNegative = numericTrend < 0;
              
              // Get PSF values from similar properties transactions
              const historicalTransactions = mlPredictionData?.comparison_data?.historicalTransactions || comparisonData?.historicalTransactions || [];
              
              let psfValues = [];
              if (historicalTransactions.length > 0) {
                // Extract PSF values from transactions
                psfValues = historicalTransactions.map(transaction => {
                  const unitPricePsf = transaction.unitPricePsf || transaction.unit_price_psf || '$0';
                  // Remove $ and parse the number
                  const psfValue = parseFloat(unitPricePsf.replace(/[$,]/g, ''));
                  return isNaN(psfValue) ? 0 : psfValue;
                }).filter(psf => psf > 0);
              }
              
              // Calculate price range based on actual transaction PSF values
              let minPrice, maxPrice, basePrice;
              
              if (psfValues.length > 0) {
                // Use actual transaction PSF data
                minPrice = Math.min(...psfValues);
                maxPrice = Math.max(...psfValues);
                basePrice = (minPrice + maxPrice) / 2;
                
                // Add some padding to the range
                const range = maxPrice - minPrice;
                const padding = range * 0.1; // 10% padding
                minPrice = Math.max(0, minPrice - padding);
                maxPrice = maxPrice + padding;
              } else {
                // Fallback to estimated sales price if no transaction data
                const estimatedPriceStr = mlPredictionData?.comparison_data?.estimatedSalesPrice || comparisonData?.estimatedSalesPrice || '$1M';
                basePrice = 1000000; // Default fallback
                
                if (estimatedPriceStr.includes('M')) {
                  basePrice = parseFloat(estimatedPriceStr.replace(/[$,M]/g, '')) * 1000000;
                } else if (estimatedPriceStr.includes('k')) {
                  basePrice = parseFloat(estimatedPriceStr.replace(/[$,k]/g, '')) * 1000;
                }
                
                // Create price range based on trend
                const trendMultiplier = Math.abs(numericTrend) / 100;
                const priceRange = basePrice * Math.max(0.2, trendMultiplier * 2);
                
                minPrice = basePrice - priceRange;
                maxPrice = basePrice + priceRange;
              }
              
              // Format PSF price labels
              const formatPrice = (price) => {
                if (price >= 1000) {
                  return `$${(price / 1000).toFixed(1)}k psf`;
                } else {
                  return `$${price.toFixed(0)} psf`;
                }
              };
              
              // Generate 8 data points representing 4 years (every 6 months)
              const dataPoints = [];
              const chartWidth = 350;
              const chartHeight = 280;
              
              // 4-year period labels (every 6 months)
              const timeLabels = ['2021', 'Mid-21', '2022', 'Mid-22', '2023', 'Mid-23', '2024', '2025'];
              
              // Create property-specific seed for consistent but unique results
              const propertyAddress = property?.address || 'default-address';
              const propertyType = property?.propertyType || 'default-type';
              const propertyArea = property?.floorArea || 'default-area';
              const propertyHash = (propertyAddress + propertyType + propertyArea).split('').reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
              }, 0);
              
              for (let i = 0; i < 8; i++) {
                const xPos = 50 + (i / 7) * chartWidth;
                const progress = i / 7; // 0 to 1
                
                // Create realistic market trend with natural fluctuations
                let currentPrice;
                
                // Base trend calculation
                const trendDirection = numericTrend > 0 ? 1 : numericTrend < 0 ? -1 : 0;
                const trendStrength = Math.abs(numericTrend) / 100; // Convert percentage to decimal
                
                // Start with base price
                const startPrice = basePrice;
                const endPrice = basePrice * (1 + (trendDirection * trendStrength));
                
                // Linear trend component
                const linearTrend = startPrice + (endPrice - startPrice) * progress;
                
                // Add natural market fluctuations (sine waves with different frequencies)
                const seasonalVariation = basePrice * 0.03 * Math.sin(progress * Math.PI * 4 + propertyHash * 0.1);
                const marketVolatility = basePrice * 0.02 * Math.sin(progress * Math.PI * 8 + propertyHash * 0.2);
                const randomVariation = basePrice * 0.015 * Math.sin(progress * Math.PI * 12 + propertyHash * 0.3);
                
                // Combine all components
                currentPrice = linearTrend + seasonalVariation + marketVolatility + randomVariation;
                
                // Ensure price stays within reasonable bounds
                const minBound = Math.min(startPrice, endPrice) * 0.9;
                const maxBound = Math.max(startPrice, endPrice) * 1.1;
                currentPrice = Math.max(minBound, Math.min(maxBound, currentPrice));
                
                // Convert price to Y position (inverted for SVG)
                const normalizedPrice = (currentPrice - minPrice) / (maxPrice - minPrice);
                const yPos = 40 + (1 - normalizedPrice) * chartHeight;
                
                dataPoints.push({
                  x: xPos,
                  y: Math.max(40, Math.min(320, yPos)),
                  price: currentPrice,
                  month: timeLabels[i]
                });
              }
              
              // Create smooth path
              const pathData = dataPoints.map((point, index) => {
                if (index === 0) {
                  return `M ${point.x},${point.y}`;
                } else {
                  const prevPoint = dataPoints[index - 1];
                  const controlX = (prevPoint.x + point.x) / 2;
                  const controlY = (prevPoint.y + point.y) / 2;
                  return `Q ${controlX},${controlY} ${point.x},${point.y}`;
                }
              }).join(' ');
              
              const strokeColor = isPositive ? "#10b981" : isNegative ? "#ef4444" : "#6b7280";
              
              return (
                <>
                  {/* Axes */}
                  <line x1="50" y1="40" x2="50" y2="320" stroke="#d1d5db" strokeWidth="2" />
                  <line x1="50" y1="320" x2="400" y2="320" stroke="#d1d5db" strokeWidth="2" />
                  
                  {/* Y-axis labels */}
                  <text x="45" y="45" fontSize="12" fill="#374151" textAnchor="end" fontWeight="500">
                    {formatPrice(maxPrice)}
                  </text>
                  <text x="45" y="180" fontSize="12" fill="#374151" textAnchor="end" fontWeight="500">
                    {formatPrice(basePrice)}
                  </text>
                  <text x="45" y="315" fontSize="12" fill="#374151" textAnchor="end" fontWeight="500">
                    {formatPrice(minPrice)}
                  </text>
                  
                  {/* X-axis labels */}
                  {dataPoints.map((point, index) => (
                    <text 
                      key={index}
                      x={point.x} 
                      y="340" 
                      fontSize="11" 
                      fill="#6b7280" 
                      textAnchor="middle" 
                      fontWeight="500"
                    >
                      {point.month}
                    </text>
                  ))}
                  
                  {/* Grid lines */}
                  <line x1="50" y1="100" x2="400" y2="100" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2" />
                  <line x1="50" y1="180" x2="400" y2="180" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2" />
                  <line x1="50" y1="260" x2="400" y2="260" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2" />
                  <line x1="50" y1="320" x2="400" y2="320" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2" />
                  
                  {/* Trend line */}
                  <path
                    d={pathData}
              fill="none"
                    stroke={strokeColor}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Data points */}
                  {dataPoints.map((point, index) => (
                    <circle 
                      key={index}
                      cx={point.x} 
                      cy={point.y} 
                      r="6" 
                      fill={strokeColor}
                      stroke="white"
                      strokeWidth="3"
                      title={`${point.month}: ${formatPrice(point.price)}`}
                    />
                  ))}
                </>
              );
            })()}
          </svg>
        </div>
          </>
        )}
      </div>

      {/* Similar Properties Transactions */}
      <div className="property-card-transactions-section">
        <h3>Similar Properties Transactions</h3>
        {isLoadingPrediction ? (
          <div className="property-card-loading">
            <div className="property-card-loading-spinner"></div>
            <p>Finding similar transactions...</p>
          </div>
        ) : (
          <>
        <div className="property-card-transactions-table">
          <div className="property-card-table-header">
            <div className="property-card-table-cell">Address</div>
            <div className="property-card-table-cell">Property Type</div>
            <div 
              className="property-card-table-cell property-card-sortable-header" 
              onClick={() => handleSort('floorArea')}
              style={{ cursor: 'pointer' }}
            >
              Floor Area {getSortIcon('floorArea')}
            </div>
            <div 
              className="property-card-table-cell property-card-sortable-header" 
              onClick={() => handleSort('date')}
              style={{ cursor: 'pointer' }}
            >
              Date {getSortIcon('date')}
            </div>
            <div 
              className="property-card-table-cell property-card-sortable-header" 
              onClick={() => handleSort('price')}
              style={{ cursor: 'pointer' }}
            >
              Sales Price {getSortIcon('price')}
            </div>
            <div 
              className="property-card-table-cell property-card-sortable-header" 
              onClick={() => handleSort('unitPricePsf')}
              style={{ cursor: 'pointer' }}
            >
              Unit Price ($ psf) {getSortIcon('unitPricePsf')}
            </div>
            <div className="property-card-table-cell">Postal District</div>
          </div>
              {(() => {
                const allTransactions = mlPredictionData?.comparison_data?.historicalTransactions || comparisonData?.historicalTransactions || [];
                
                // Show empty state if no transactions
                if (allTransactions.length === 0) {
                  return (
                    <div className="property-card-empty-state">
                      <div className="property-card-empty-message">
                        <p>No similar properties transacted in the database</p>
                        <p className="property-card-empty-subtitle">
                          No {property?.propertyType || 'properties'} of similar type and location have been transacted recently.
                        </p>
                      </div>
                    </div>
                  );
                }
                
                const sortedTransactions = sortTransactions(allTransactions);
                const transactionsToShow = showAllTransactions ? sortedTransactions : sortedTransactions.slice(0, 2);
                
                return transactionsToShow.map((transaction, index) => (
            <div key={index} className="property-card-table-row">
              <div className="property-card-table-cell">{transaction.address}</div>
              <div className="property-card-table-cell">{transaction.propertyType}</div>
              <div className="property-card-table-cell">{transaction.floorArea}</div>
              <div className="property-card-table-cell">{transaction.date}</div>
              <div className="property-card-table-cell">{transaction.price}</div>
              <div className="property-card-table-cell">{transaction.unitPricePsf || 'N/A'}</div>
              <div className="property-card-table-cell">{transaction.postalDistrict || 'N/A'}</div>
            </div>
                ));
              })()}
        </div>
        {(() => {
          const allTransactions = mlPredictionData?.comparison_data?.historicalTransactions || comparisonData?.historicalTransactions || [];
          if (allTransactions.length <= 2) return null; // Don't show button if 2 or fewer transactions
          
          return (
            <div className="property-card-see-more" onClick={handleSeeMoreClick}>
              {showAllTransactions ? 'Show Less' : `See More (${allTransactions.length - 2} more)`}
            </div>
          );
        })()}
          </>
        )}
      </div>

      {/* Price Statistics */}
      <div className="property-card-price-stats">
        {isLoadingPrediction ? (
          <div className="property-card-loading">
            <div className="property-card-loading-spinner"></div>
            <p>Calculating price statistics...</p>
          </div>
        ) : (
          <>
        <div className="property-card-stat-item">
          <div className="property-card-stat-content">
            <div className="property-card-stat-label">Median Sale Price:</div>
                <div className="property-card-stat-description">
                  {(() => {
                    const historicalTransactions = mlPredictionData?.comparison_data?.historicalTransactions || comparisonData?.historicalTransactions || [];
                    const propertyType = property?.propertyType || 'properties';
                    const medianPrice = mlPredictionData?.comparison_data?.medianSalePrice || comparisonData?.medianSalePrice || 'N/A';
                    
                    // Get district from first transaction if available
                    let district = 'N/A';
                    if (historicalTransactions.length > 0 && historicalTransactions[0].postalDistrict) {
                      district = historicalTransactions[0].postalDistrict;
                    }
                    
                    return `The median sale price for ${propertyType} in ${district} is ${medianPrice}.`;
                  })()}
                </div>
          </div>
        </div>
        <div className="property-card-stat-item">
          <div className="property-card-stat-content">
            <div className="property-card-stat-label">Highest Sold Price:</div>
                <div className="property-card-stat-description">
                  {mlPredictionData?.comparison_data?.highestSoldPriceDescription || comparisonData?.highestSoldPriceDescription || 'Details of the highest recorded sale price for a comparable property.'}
                </div>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Location Map */}
      <div className="property-card-location-section">
        <h3>Location Map</h3>
        <div id={mapId} className="property-card-map-container"></div>
        

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
        {property?.propertyType && (
          <div className="property-card-filter-info">
            Showing <strong>{property.propertyType}</strong> properties near <strong>{property.address}</strong>
          </div>
        )}
        
        {isLoadingNearby && (
          <div className="property-card-listings-loading">Loading nearby properties...</div>
        )}
        
        {nearbyError && (
          <div className="property-card-listings-error">{nearbyError}</div>
        )}
        
        {!isLoadingNearby && !nearbyError && nearbyProperties.length === 0 && (
          <div className="property-card-listings-empty">
            No {property?.propertyType} properties found near this address.
          </div>
        )}
        
        {!isLoadingNearby && nearbyProperties.length > 0 && (
          <>
            <div className="property-card-listings-table">
              <div className="property-card-table-header">
                <div className="property-card-table-cell">Address</div>
                <div className="property-card-table-cell">Property Type</div>
                <div className="property-card-table-cell">Size</div>
                <div className="property-card-table-cell">Price</div>
                <div className="property-card-table-cell">Action</div>
              </div>
              {nearbyProperties
                .filter(listing => listing.property_type === property?.propertyType)
                .map((listing, index) => (
                  <div key={listing.id || index} className="property-card-table-row">
                    <div className="property-card-table-cell">{listing.address}</div>
                    <div className="property-card-table-cell">{listing.property_type}</div>
                    <div className="property-card-table-cell">
                      {listing.size_sqft ? `${listing.size_sqft.toLocaleString()} sq ft` : 'N/A'}
                    </div>
                    <div className="property-card-table-cell">
                      {listing.asking_price ? 
                        (listing.price_type === 'rental' ? 
                          `$${(listing.asking_price / 1000).toFixed(0)}k/month` : 
                          (listing.asking_price >= 1000000 ? 
                            `$${(listing.asking_price / 1000000).toFixed(1)}M` : 
                            `$${(listing.asking_price / 1000).toFixed(0)}k`
                          )
                        ) : 'N/A'
                      }
                    </div>
                    <div className="property-card-table-cell">
                      <button 
                        className="property-card-view-details-btn"
                        onClick={() => navigate(`/dashboard/property-listing/${listing.id}`)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            <div className="property-card-see-more" onClick={handleSeeMoreListingsClick}>See More</div>
          </>
        )}
      </div>

      {/* Contact Agents */}
      <div className="property-card-agents-section">
        <h3>Contact Agents</h3>
        

        
        {isLoadingAgents && (
          <div className="property-card-agents-loading">Loading agents for this region...</div>
        )}
        
        {agentsError && (
          <div className="property-card-agents-error">{agentsError}</div>
        )}
        
        {!isLoadingAgents && !agentsError && regionAgents.length === 0 && (
          <div className="property-card-agents-note">
            No agents are currently assigned to this region.
          </div>
        )}
        
        {!isLoadingAgents && regionAgents.length > 0 && (
          <>
            <div className="property-card-agents-note">
              Agents assigned to this region: <strong>{regionAgents[0]?.region}</strong>
            </div>
            <div className="property-card-agents-list">
              {regionAgents.map((agent, index) => (
                <div key={agent.id || index} className="property-card-agent-item">
                  <div className="property-card-agent-avatar">
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="property-card-agent-info">
                    <div className="property-card-agent-name">{agent.name}</div>
                    <div className="property-card-agent-company">{agent.company}</div>
                    {agent.license && (
                      <div className="property-card-agent-license">License: {agent.license}</div>
                    )}
                    {agent.experience && (
                      <div className="property-card-agent-experience">{agent.experience} years experience</div>
                    )}
                  </div>
                  <div className="property-card-agent-contact">
                    <div className="property-card-agent-phone">{agent.phone}</div>
                    <div className="property-card-agent-email">{agent.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;
