import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './header';
import Navbar from './navbar';
import Footer from './footer';
import './support.css';

const Support = () => {
  const [activeTab, setActiveTab] = useState('support');
  const [expandedFAQ, setExpandedFAQ] = useState(null); // Track which FAQ is expanded
  const location = useLocation();

  // Get user type from localStorage
  const userType = localStorage.getItem('userType') || 'free';

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

  // FAQ Data
  const faqData = [
    {
      id: 0,
      question: "How accurate are the property predictions?",
      answer: "Our property predictions are based on a sophisticated algorithm that analyzes various market trends, historical data, and property-specific attributes. While we strive for high accuracy, predictions should be considered as estimates and not guarantees. We recommend using our predictions as one tool among many in your decision-making process."
    },
    {
      id: 1,
      question: "What types of properties can I get predictions for?",
      answer: "We provide predictions for various commercial and industrial property types including office spaces, retail units, warehouses, factories, and mixed-use developments. Our system covers both freehold and leasehold properties across Singapore."
    },
    {
      id: 2,
      question: "How do I bookmark a property or comparison?",
      answer: "To bookmark a property or comparison, simply click the bookmark icon (🔖) next to any property listing or comparison result. You can access all your bookmarked items from the Bookmarks section in the navigation menu."
    },
    {
      id: 3,
      question: "What are the benefits of upgrading to a premium subscription?",
      answer: "Premium subscribers get access to advanced features including detailed market analysis, comparison tools, priority customer support, unlimited predictions, and exclusive market insights and reports."
    },
    {
      id: 4,
      question: "How do I interpret the different data points on the prediction and comparison pages?",
      answer: "Each data point represents different market indicators such as recent sales, rental yields, market trends, and property-specific factors. Hover over any data point for detailed explanations, and refer to our comprehensive guide in the Help section."
    },
    {
      id: 5,
      question: "How do I contact support for further assistance?",
      answer: "You can reach our support team via email at support@propertyinsights.com or call us at +1-800-555-0199 during business hours (Mon-Fri, 9am-6pm SGT). We typically respond within 24 hours."
    }
  ];



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
          </section>

          {/* Contact Support */}
          <section id="support-contact-section" className="support-contact-section">
            <h2 className="support-subsection-title">Contact Support</h2>
            <div className="support-contact-info">
              <div className="support-contact-item">
                <span className="support-contact-label">📧 Email:</span>
                <a 
                  href="mailto:support@propertyinsights.com" 
                  className="support-contact-link"
                  title="Click to send email"
                >
                  support@propertyinsights.com
                </a>
              </div>
              <div className="support-contact-item">
                <span className="support-contact-label">📞 Phone Support:</span>
                <a 
                  href="tel:+1-800-555-0199" 
                  className="support-contact-link"
                  title="Click to call"
                >
                  +1-800-555-0199
                </a>
                <span className="support-contact-hours"> (Mon-Fri, 9am-6pm SGT)</span>
              </div>
            </div>
          </section>

          {/* Disclaimer */}
          <section id="support-disclaimer-section" className="support-disclaimer-section">
            <h2 className="support-subsection-title">Disclaimer</h2>
            <p className="support-disclaimer-text">
              Property predictions provided on this platform are estimates based on available data and should not be considered as financial or investment advice. We recommend conducting your own research and consulting with qualified professionals before making any property-related decisions.
            </p>
          </section>

          {/* Privacy Policy */}
          <section id="support-privacy-section" className="support-privacy-section">
            <h2 className="support-subsection-title">Privacy Policy</h2>
            <p className="support-policy-intro">Your privacy is important to us. Here's a summary of our key privacy practices:</p>
            <ul className="support-policy-list">
              <li>We collect data necessary for providing property predictions and improving our services</li>
              <li>Your information is used to personalize your experience and provide relevant insights</li>
              <li>We may share data with trusted partners but never sell your personal information</li>
              <li>We implement industry-standard security measures to protect your data</li>
              <li>You have the right to access, correct, or delete your information at any time</li>
            </ul>
          </section>

          {/* Terms of Use */}
          <section id="support-terms-section" className="support-terms-section">
            <h2 className="support-subsection-title">Terms of Use</h2>
            <p className="support-terms-intro">Here's a summary of the key terms for using our platform:</p>
            <ul className="support-terms-list">
              <li>You agree to use the platform responsibly and in accordance with applicable laws</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>All content and predictions on the platform are owned by Valuez</li>
              <li>We are not liable for any losses resulting from reliance on our predictions</li>
              <li>We reserve the right to suspend or terminate access for violations of these terms</li>
              <li>These terms are governed by Singapore laws</li>
            </ul>
          </section>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Support;
