import React, { useState, useEffect } from 'react';
import './HowItWorks.css';
import Navbar from './Navbar';
import Footer from './Footer';
import PropertyCard from '../user/PropertyCard';
import api from '../../services/api';

const HowItWorks = () => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch HowItWorks properties from API
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await api.howitworks.getProperties();
        if (response.success) {
          // Transform API data to match the expected card format
          const transformedCards = response.properties.map(property => ({
            id: property.id,
            title: property.title,
            address: property.address,
            type: property.property_type,
            floors: property.property_type === 'Commercial' ? 20 : 1, // Commercial: 20 floors, Industrial: 1 floor
            sqft: parseInt(property.unit_area.replace(/,/g, '')) || 0,
            image: property.image_url,
            property: { address: property.address },
            // Generate comparison data automatically based on property type
            comparisonData: generateComparisonData(property)
          }));
          setCards(transformedCards);
        }
      } catch (error) {
        console.error('Error fetching HowItWorks properties:', error);
        // Fallback to empty array if API fails
        setCards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Generate comparison data automatically based on property
  const generateComparisonData = (property) => {
    const basePrice = property.property_type === 'Commercial' ? 15000000 : 8500000;
    const baseRental = property.property_type === 'Commercial' ? 45000 : 25000;
    const area = parseInt(property.unit_area.replace(/,/g, '')) || 0;
    
    return {
      estimatedSalesPrice: `$${(basePrice * (area / 30000)).toLocaleString()}`,
      estimatedRentalPrice: `$${baseRental.toLocaleString()}/month`,
      propertyType: property.property_type,
      floorArea: property.unit_area,
      tenure: property.property_type === 'Commercial' ? '99-year leasehold' : '30-year leasehold',
      level: property.level,
      otherDetails: property.property_type === 'Commercial' ? 'Premium Grade A office space' : 'Heavy industrial facility',
      marketTrend: property.property_type === 'Commercial' ? '+12.5%' : '+8.2%',
      marketTrendPeriod: 'Last 12 months',
      medianSalePrice: `$${(basePrice * 0.8).toLocaleString()}`,
      highestSoldPriceDescription: property.property_type === 'Commercial' ? 'Premium office space with panoramic city views' : 'Modern industrial facility with advanced infrastructure',
      historicalTransactions: generateHistoricalTransactions(property),
      activeListings: generateActiveListings(property),
      agents: generateAgents(property)
    };
  };

  const generateHistoricalTransactions = (property) => {
    const basePrice = property.property_type === 'Commercial' ? 15000000 : 8500000;
    return [
      { address: property.address.replace(/\d+/, (match) => parseInt(match) - 2), type: property.property_type, area: property.unit_area, date: '2023-12', price: `$${(basePrice * 0.85).toLocaleString()}` },
      { address: property.address.replace(/\d+/, (match) => parseInt(match) + 2), type: property.property_type, area: property.unit_area, date: '2023-11', price: `$${(basePrice * 1.1).toLocaleString()}` },
      { address: property.address.replace(/\d+/, (match) => parseInt(match) + 5), type: property.property_type, area: property.unit_area, date: '2023-10', price: `$${(basePrice * 0.9).toLocaleString()}` }
    ];
  };

  const generateActiveListings = (property) => {
    const basePrice = property.property_type === 'Commercial' ? 15000000 : 8500000;
    return [
      { id: 1, address: `${property.address}, ${property.level}`, type: property.property_type, area: property.unit_area, price: `$${basePrice.toLocaleString()}` },
      { id: 2, address: property.address.replace(/\d+/, (match) => parseInt(match) + 2), type: property.property_type, area: property.unit_area, price: `$${(basePrice * 0.83).toLocaleString()}` },
      { id: 3, address: property.address.replace(/\d+/, (match) => parseInt(match) + 5), type: property.property_type, area: property.unit_area, price: `$${(basePrice * 1.2).toLocaleString()}` }
    ];
  };

  const generateAgents = (property) => {
    const names = ['Sarah Chen', 'Michael Wong', 'David Lim', 'Lisa Tan', 'Jennifer Lee', 'Robert Ng'];
    const titles = ['Senior Commercial Agent', 'Commercial Property Specialist', 'Industrial Property Expert', 'Industrial Sales Specialist', 'Retail Property Specialist', 'Commercial Investment Advisor'];
    
    return [
      { name: names[Math.floor(Math.random() * names.length)], title: titles[Math.floor(Math.random() * titles.length)], image: '👩‍💼' },
      { name: names[Math.floor(Math.random() * names.length)], title: titles[Math.floor(Math.random() * titles.length)], image: '👨‍💼' }
    ];
  };


  return (
    <div className="howitworks-page">
      <Navbar />

      <section className="how-hero">
        <h1 className="section-title" style={{ color: '#fff', marginTop: '4rem' }}>See How it Works</h1>
      </section>

      {/* Card Grid */}
      <section className="how-grid">
        {loading ? (
          <div className="how-loading">Loading properties...</div>
        ) : (
          cards.map(card => (
          <article className="how-card" key={card.id}>
            <div className="how-card-image" style={{ backgroundImage: `url('${card.image}')` }} />
            <div className="how-card-body">
              <h3>{card.title}</h3>
              <p className="muted">{card.address}</p>
              <div className="how-meta">
                <span className="meta-badge">{card.type === 'Commercial' ? '🏢' : '🏭'} {card.type}</span>
                <span className="meta-item">📏 {card.sqft.toLocaleString()} sqft</span>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setSelectedCard(card.id)}
              >
                View Details
              </button>
            </div>
          </article>
          ))
        )}
      </section>

      {/* Property Card Details */}
      {selectedCard && (
        <section className="how-details">
          <div className="details-header">
            <button 
              className="close-btn"
              onClick={() => setSelectedCard(null)}
            >
              ✕ Close
            </button>
          </div>
          {(() => {
            const card = cards.find(c => c.id === selectedCard);
            return (
              <div className="property-details-simple">
                <h2 className="property-title">{card.title}</h2>
                <p className="property-address">{card.address}</p>
                
                {/* Estimated Prices */}
                <div className="price-section">
                  <div className="price-item">
                    <h3>Estimated Sales Price</h3>
                    <div className="price-value">{card.comparisonData.estimatedSalesPrice}</div>
                  </div>
                  <div className="price-item">
                    <h3>Estimated Rental Price</h3>
                    <div className="price-value">{card.comparisonData.estimatedRentalPrice}</div>
                  </div>
                </div>

                {/* Property Details */}
                <div className="details-section">
                  <h3>Property Details</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Property Type:</span>
                      <span className="detail-value">{card.comparisonData.propertyType}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Floor Area:</span>
                      <span className="detail-value">{card.comparisonData.floorArea} sq ft</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Tenure:</span>
                      <span className="detail-value">{card.comparisonData.tenure}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Level:</span>
                      <span className="detail-value">{card.comparisonData.level}</span>
                    </div>
                  </div>
                </div>

                {/* Market Trends */}
                <div className="market-section">
                  <h3>Market Trends</h3>
                  <div className="trend-info">
                    <div className="trend-percentage">{card.comparisonData.marketTrend}</div>
                    <div className="trend-period">{card.comparisonData.marketTrendPeriod}</div>
                  </div>
                </div>

                {/* Historical Transactions */}
                <div className="transactions-section">
                  <h3>Recent Transactions</h3>
                  <div className="transactions-list">
                    {card.comparisonData.historicalTransactions.map((transaction, index) => (
                      <div key={index} className="transaction-item">
                        <div className="transaction-address">{transaction.address}</div>
                        <div className="transaction-details">
                          <span>{transaction.type}</span>
                          <span>{transaction.area}</span>
                          <span>{transaction.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Listings */}
                <div className="listings-section">
                  <h3>Active Listings</h3>
                  <div className="listings-list">
                    {card.comparisonData.activeListings.map((listing, index) => (
                      <div key={index} className="listing-item">
                        <div className="listing-address">{listing.address}</div>
                        <div className="listing-details">
                          <span>{listing.type}</span>
                          <span>{listing.area}</span>
                          <span>{listing.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agents */}
                <div className="agents-section">
                  <h3>Contact Agents</h3>
                  <div className="agents-list">
                    {card.comparisonData.agents.map((agent, index) => (
                      <div key={index} className="agent-item">
                        <div className="agent-avatar">{agent.image}</div>
                        <div className="agent-info">
                          <div className="agent-name">{agent.name}</div>
                          <div className="agent-title">{agent.title}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
      )}

      <Footer />
    </div>
  );
};

export default HowItWorks;

