import React from 'react';
import './Features.css';

const Features = () => {
  return (
    <section className="features" id="how">
      <h2 className="section-title">How it Works</h2>
      <div className="features-grid">
        <div className="feature">
          <h3>Provide Details</h3>
          <p>Enter property type, location, size, and lease information.</p>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📝</span>
        </div>
        <div className="feature">
          <h3>Analysis</h3>
          <p>Our model analyzes market data in real-time.</p>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🔍</span>
        </div>
        <div className="feature">
          <h3>Get Your Valuation</h3>
          <p>Instant estimate with key drivers and a price range.</p>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>💰</span>
        </div>
      </div>
    </section>
  );
};

export default Features;
