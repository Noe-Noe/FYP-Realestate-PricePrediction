import React, { useState } from 'react';
import './FAQ.css';

const FAQ = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <section className="faq-section" id="faq">
      <div className="faq-container">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <p className="section-subtitle">Have questions? We've got answers. Here are some common queries about our platform.</p>
        
        <div className="faq-accordion">
          <div className={`faq-item ${activeFaq === 0 ? 'active' : ''}`}>
            <div className="faq-question" onClick={() => toggleFaq(0)}>
              <h3>How accurate are the predictions?</h3>
              <span className="faq-toggle">+</span>
            </div>
            <div className="faq-answer">
              <p>Our predictions are based on a machine learning model trained on extensive historical data, geospatial information, and property features. While we strive for high accuracy, predictions should be used as a guide and not as definitive values.</p>
            </div>
          </div>
          
          <div className={`faq-item ${activeFaq === 1 ? 'active' : ''}`}>
            <div className="faq-question" onClick={() => toggleFaq(1)}>
              <h3>What property types are supported?</h3>
              <span className="faq-toggle">+</span>
            </div>
            <div className="faq-answer">
              <p>Currently, we support commercial and industrial properties in Singapore. This includes office buildings, retail spaces, warehouses, factories, and other commercial real estate.</p>
            </div>
          </div>
          
          <div className={`faq-item ${activeFaq === 2 ? 'active' : ''}`}>
            <div className="faq-question" onClick={() => toggleFaq(2)}>
              <h3>Where does the data come from?</h3>
              <span className="faq-toggle">+</span>
            </div>
            <div className="faq-answer">
              <p>Our data comes from multiple sources including government databases, real estate transactions, market reports, and proprietary algorithms. We ensure all data is accurate, up-to-date, and compliant with local regulations.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
