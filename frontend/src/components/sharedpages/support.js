import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './header';
import Navbar from './navbar';
import Footer from './footer';
import './support.css';
import api from '../../services/api';

const Support = () => {
  const [activeTab, setActiveTab] = useState('support');
  const [expandedFAQ, setExpandedFAQ] = useState(null); // Track which FAQ is expanded
  const [faqData, setFaqData] = useState([]);
  const [contactInfo, setContactInfo] = useState({});
  const [legalContent, setLegalContent] = useState({});
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Get user type from localStorage
  const userType = localStorage.getItem('userType') || 'free';

  // Fetch support content from API
  useEffect(() => {
    const fetchSupportContent = async () => {
      try {
        setLoading(true);
        
        // Fetch FAQ data
        const faqResponse = await api.support.getFAQ();
        if (faqResponse.success) {
          setFaqData(faqResponse.faqs);
        }
        
        // Fetch contact info
        const contactResponse = await api.support.getContact();
        if (contactResponse.success) {
          setContactInfo(contactResponse.contact);
        }
        
        // Fetch legal content
        const legalResponse = await api.support.getLegal();
        if (legalResponse.success) {
          setLegalContent(legalResponse.legal_content);
        }
        
      } catch (error) {
        console.error('Error fetching support content:', error);
        // Fallback to empty data if API fails
        setFaqData([]);
        setContactInfo({});
        setLegalContent({});
      } finally {
        setLoading(false);
      }
    };

    fetchSupportContent();
  }, []);

  // Handle automatic scrolling to sections when navigating from footer
  useEffect(() => {
    console.log('Support component useEffect triggered');
    console.log('Location hash:', location.hash);
    console.log('Location state:', location.state);
    
    // Check for URL hash navigation first
    if (location.hash) {
      const section = location.hash.substring(1); // Remove the # symbol
      console.log('Scrolling to section from hash:', section);
      setTimeout(() => {
        const element = document.getElementById(`support-${section}-section`);
        console.log('Found element for scrolling from hash:', element);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        } else {
          console.log('Element not found for scrolling to section from hash:', section);
        }
      }, 100);
    }
    // Also check for navigation state (fallback)
    else if (location.state?.scrollToSection) {
      const section = location.state.scrollToSection;
      console.log('Scrolling to section from state:', section);
      setTimeout(() => {
        const element = document.getElementById(`support-${section}-section`);
        console.log('Found element for scrolling from state:', element);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        } else {
          console.log('Element not found for scrolling to section from state:', section);
        }
      }, 100);
    }
  }, [location.hash, location.state]);

  // Handle initial page load with hash (for page refresh scenarios)
  useEffect(() => {
    if (location.hash) {
      const section = location.hash.substring(1);
      console.log('Initial page load with hash, scrolling to section:', section);
      // Use a longer delay for initial page load to ensure all elements are rendered
      setTimeout(() => {
        const element = document.getElementById(`support-${section}-section`);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 300);
    }
  }, []); // Empty dependency array - only run once on mount




  const toggleFAQ = (faqId) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };



  return (
    <div className="user-dashboard">
      {/* Top Header */}
      <Header />

      <div className="user-dashboard-container">
        {/* Left Sidebar */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />


        {/* Main Content */}
        <main className="user-main-content">
          <h1 className="support-section-title">Help Center</h1>
          
          {/* Frequently Asked Questions */}
          <section className="support-faq-section">
            <h2 className="support-subsection-title">Frequently Asked Questions</h2>
            {loading ? (
              <div className="support-loading">Loading FAQs...</div>
            ) : (
              <div className="support-faq-list">
                {faqData.map((faq) => (
                  <div key={faq.id} className="support-faq-item">
                    <button 
                      className={`support-faq-question ${expandedFAQ === faq.id ? 'expanded' : ''}`}
                      onClick={() => toggleFAQ(faq.id)}
                    >
                      <span className="support-faq-text">{faq.question}</span>
                      <span className="support-faq-icon">
                        {expandedFAQ === faq.id ? '▼' : '▶'}
                      </span>
                    </button>
                    {expandedFAQ === faq.id && (
                      <div className="support-faq-answer">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Contact Support */}
          <section id="support-contact-section" className="support-contact-section">
            <h2 className="support-subsection-title">Contact Support</h2>
            <div className="support-contact-info">
              {contactInfo.email && (
                <div className="support-contact-item">
                  <span className="support-contact-label">📧 Email:</span>
                  <a 
                    href={`mailto:${contactInfo.email}`} 
                    className="support-contact-link"
                    title="Click to send email"
                  >
                    {contactInfo.email}
                  </a>
                </div>
              )}
              {contactInfo.phone && (
                <div className="support-contact-item">
                  <span className="support-contact-label">📞 Phone Support:</span>
                  <a 
                    href={`tel:${contactInfo.phone}`} 
                    className="support-contact-link"
                    title="Click to call"
                  >
                    {contactInfo.phone}
                  </a>
                  {contactInfo.hours && (
                    <span className="support-contact-hours"> ({contactInfo.hours})</span>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Disclaimer */}
          {legalContent.disclaimer && (
            <section id="support-disclaimer-section" className="support-disclaimer-section">
              <h2 className="support-subsection-title">{legalContent.disclaimer.title}</h2>
              <div className="support-disclaimer-text">
                {legalContent.disclaimer.content.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>
          )}

          {/* Privacy Policy */}
          {legalContent.privacy_policy && (
            <section id="support-privacy-section" className="support-privacy-section">
              <h2 className="support-subsection-title">{legalContent.privacy_policy.title}</h2>
              <div className="support-policy-content">
                {legalContent.privacy_policy.content.split('\n').map((line, index) => {
                  if (line.trim().startsWith('•')) {
                    return (
                      <ul key={index} className="support-policy-list">
                        <li>{line.trim().substring(1).trim()}</li>
                      </ul>
                    );
                  } else if (line.trim()) {
                    return <p key={index} className="support-policy-intro">{line}</p>;
                  }
                  return null;
                })}
              </div>
            </section>
          )}

          {/* Terms of Use */}
          {legalContent.terms_of_use && (
            <section id="support-terms-section" className="support-terms-section">
              <h2 className="support-subsection-title">{legalContent.terms_of_use.title}</h2>
              <div className="support-terms-content">
                {legalContent.terms_of_use.content.split('\n').map((line, index) => {
                  if (line.trim().startsWith('•')) {
                    return (
                      <ul key={index} className="support-terms-list">
                        <li>{line.trim().substring(1).trim()}</li>
                      </ul>
                    );
                  } else if (line.trim()) {
                    return <p key={index} className="support-terms-intro">{line}</p>;
                  }
                  return null;
                })}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Support;
