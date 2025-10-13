import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './FAQ.css';

const FAQ = () => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [sectionTitle, setSectionTitle] = useState('Frequently Asked Questions');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFAQData();
  }, []);

  const fetchFAQData = async () => {
    try {
      setLoading(true);
      const [faqResponse, sectionResponse] = await Promise.all([
        api.faq.getAll(),
        api.faq.getSection()
      ]);

      if (faqResponse.success) {
        setFaqs(faqResponse.faqs || []);
      }

      if (sectionResponse.success) {
        setSectionTitle(sectionResponse.section.section_title);
      }
    } catch (error) {
      console.error('Error fetching FAQ data:', error);
      // Fallback to default FAQs if API fails
      setFaqs([
        {
          id: 1,
          question: 'How accurate are the predictions?',
          answer: 'Our predictions are based on a machine learning model trained on extensive historical data, geospatial information, and property features. While we strive for high accuracy, predictions should be used as a guide and not as definitive values.',
          category: 'General'
        },
        {
          id: 2,
          question: 'What property types are supported?',
          answer: 'Currently, we support commercial and industrial properties in Singapore. This includes office buildings, retail spaces, warehouses, factories, and other commercial real estate.',
          category: 'General'
        },
        {
          id: 3,
          question: 'Where does the data come from?',
          answer: 'Our data comes from multiple sources including government databases, real estate transactions, market reports, and proprietary algorithms. We ensure all data is accurate, up-to-date, and compliant with local regulations.',
          category: 'General'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <section className="faq-section" id="faq">
      <div className="faq-container">
        <h2 className="faq-title">{sectionTitle}</h2>
        <p className="faq-subtitle">Have questions? We've got answers. Here are some common queries about our platform.</p>

        {loading ? (
          <div className="faq-loading">
            <p>Loading FAQs...</p>
          </div>
        ) : (
          <div className="faq-accordion">
            {faqs.length > 0 ? (
              faqs.map((faq, index) => (
                <div key={faq.id} className={`faq-item ${activeFaq === index ? 'active' : ''}`}>
                  <div className="faq-question" onClick={() => toggleFaq(index)}>
                    <h3>{faq.question}</h3>
                    <span className="faq-toggle">{activeFaq === index ? '−' : '+'}</span>
                  </div>
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                    {faq.category && (
                      <div className="faq-category">
                        <span className="category-tag">{faq.category}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="faq-empty">
                <p>No FAQs available at the moment.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default FAQ;
