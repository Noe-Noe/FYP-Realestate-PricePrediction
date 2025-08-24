import React, { useState } from 'react';
import './HowItWorks.css';
import Navbar from './Navbar';
import Footer from './Footer';
import PropertyCard from '../user/PropertyCard';

const HowItWorks = () => {
  const [selectedCard, setSelectedCard] = useState(null);

  const cards = [
    {
      id: 1,
      title: 'Marina Bay Financial Centre',
      address: '10 Marina Boulevard, Singapore',
      type: 'Commercial',
      floors: 50,
      sqft: 30000,
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=250&fit=crop",
      property: { address: '10 Marina Boulevard, Singapore' },
      comparisonData: {
        estimatedSalesPrice: '$15,000,000',
        estimatedRentalPrice: '$45,000/month',
        propertyType: 'Commercial',
        floorArea: '30,000',
        tenure: '99-year leasehold',
        level: 'Level 25',
        otherDetails: 'Premium Grade A office space',
        marketTrend: '+12.5%',
        marketTrendPeriod: 'Last 12 months',
        medianSalePrice: '$12,500,000',
        highestSoldPriceDescription: 'Premium office space with panoramic city views',
        historicalTransactions: [
          { address: '8 Marina Boulevard', type: 'Commercial', area: '25,000 sqft', date: '2023-12', price: '$12,800,000' },
          { address: '12 Marina Boulevard', type: 'Commercial', area: '35,000 sqft', date: '2023-11', price: '$16,200,000' },
          { address: '15 Marina Boulevard', type: 'Commercial', area: '28,000 sqft', date: '2023-10', price: '$13,500,000' }
        ],
        activeListings: [
          { id: 1, address: '10 Marina Boulevard, Level 25', type: 'Commercial', area: '30,000 sqft', price: '$15,000,000' },
          { id: 2, address: '12 Marina Boulevard, Level 30', type: 'Commercial', area: '25,000 sqft', price: '$12,500,000' },
          { id: 3, address: '15 Marina Boulevard, Level 20', type: 'Commercial', area: '35,000 sqft', price: '$18,000,000' }
        ],
        agents: [
          { name: 'Sarah Chen', title: 'Senior Commercial Agent', image: '👩‍💼' },
          { name: 'Michael Wong', title: 'Commercial Property Specialist', image: '👨‍💼' }
        ]
      }
    },
    {
      id: 2,
      title: 'Jurong Industrial Estate',
      address: 'Jurong Island, Singapore',
      type: 'Industrial',
      floors: 8,
      sqft: 5000,
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=250&fit=crop",
      property: { address: 'Jurong Island, Singapore' },
      comparisonData: {
        estimatedSalesPrice: '$8,500,000',
        estimatedRentalPrice: '$25,000/month',
        propertyType: 'Industrial',
        floorArea: '5,000',
        tenure: '30-year leasehold',
        level: 'Ground Level',
        otherDetails: 'Heavy industrial facility',
        marketTrend: '+8.2%',
        marketTrendPeriod: 'Last 12 months',
        medianSalePrice: '$7,800,000',
        highestSoldPriceDescription: 'Modern industrial facility with advanced infrastructure',
        historicalTransactions: [
          { address: 'Jurong Island A', type: 'Industrial', area: '4,500 sqft', date: '2023-12', price: '$7,200,000' },
          { address: 'Jurong Island B', type: 'Industrial', area: '6,000 sqft', date: '2023-11', price: '$9,100,000' },
          { address: 'Jurong Island C', type: 'Industrial', area: '3,800 sqft', date: '2023-10', price: '$6,800,000' }
        ],
        activeListings: [
          { id: 4, address: 'Jurong Island, Block A', type: 'Industrial', area: '5,000 sqft', price: '$8,500,000' },
          { id: 5, address: 'Jurong Island, Block B', type: 'Industrial', area: '6,500 sqft', price: '$10,200,000' },
          { id: 6, address: 'Jurong Island, Block C', type: 'Industrial', area: '4,200 sqft', price: '$7,800,000' }
        ],
        agents: [
          { name: 'David Lim', title: 'Industrial Property Expert', image: '👨‍💼' },
          { name: 'Lisa Tan', title: 'Industrial Sales Specialist', image: '👩‍💼' }
        ]
      }
    },
    {
      id: 3,
      title: 'Orchard Gateway',
      address: '277 Orchard Road, Singapore',
      type: 'Commercial',
      floors: 20,
      sqft: 8000,
      image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=250&fit=crop",
      property: { address: '277 Orchard Road, Singapore' },
      comparisonData: {
        estimatedSalesPrice: '$12,000,000',
        estimatedRentalPrice: '$35,000/month',
        propertyType: 'Commercial',
        floorArea: '8,000',
        tenure: '99-year leasehold',
        level: 'Level 15',
        otherDetails: 'Retail and office complex',
        marketTrend: '+15.3%',
        marketTrendPeriod: 'Last 12 months',
        medianSalePrice: '$10,500,000',
        highestSoldPriceDescription: 'Prime retail location in Orchard Road',
        historicalTransactions: [
          { address: '280 Orchard Road', type: 'Commercial', area: '7,500 sqft', date: '2023-12', price: '$11,200,000' },
          { address: '285 Orchard Road', type: 'Commercial', area: '9,000 sqft', date: '2023-11', price: '$13,800,000' },
          { address: '290 Orchard Road', type: 'Commercial', area: '6,800 sqft', date: '2023-10', price: '$9,900,000' }
        ],
        activeListings: [
          { id: 7, address: '277 Orchard Road, Level 15', type: 'Commercial', area: '8,000 sqft', price: '$12,000,000' },
          { id: 8, address: '280 Orchard Road, Level 12', type: 'Commercial', area: '7,500 sqft', price: '$11,200,000' },
          { id: 9, address: '285 Orchard Road, Level 18', type: 'Commercial', area: '9,000 sqft', price: '$13,800,000' }
        ],
        agents: [
          { name: 'Jennifer Lee', title: 'Retail Property Specialist', image: '👩‍💼' },
          { name: 'Robert Ng', title: 'Commercial Investment Advisor', image: '👨‍💼' }
        ]
      }
    }
  ];

  return (
    <div className="howitworks-page">
      <Navbar />

      <section className="how-hero">
        <h1 className="section-title" style={{ color: '#fff', marginTop: '4rem' }}>See How it Works</h1>
      </section>

      {/* Card Grid */}
      <section className="how-grid">
        {cards.map(card => (
          <article className="how-card" key={card.id}>
            <div className="how-card-image" style={{ backgroundImage: `url('${card.image}')` }} />
            <div className="how-card-body">
              <h3>{card.title}</h3>
              <p className="muted">{card.address}</p>
              <div className="how-meta">
                <span className="meta-badge">{card.type === 'Commercial' ? '🏢' : '🏭'} {card.type}</span>
                <span className="meta-item">🏗️ {card.floors} Floors</span>
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
        ))}
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

