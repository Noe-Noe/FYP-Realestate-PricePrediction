import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './footer.css';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleFooterLinkClick = (section) => {
    console.log('Footer link clicked:', section);
    console.log('Current pathname:', location.pathname);
    
    // If we're already on the support page, scroll to the section
    if (location.pathname === '/support') {
      console.log('Already on support page, scrolling to section:', section);
      // Update URL hash for better UX
      window.location.hash = section;
      const element = document.getElementById(`support-${section}-section`);
      console.log('Found element:', element);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      } else {
        console.log('Element not found for section:', section);
      }
    } else {
      // Navigate to support page with section parameter using URL hash
      console.log('Navigating to support page with section:', section);
      navigate(`/support#${section}`);
    }
  };

  return (
    <footer className="footer-dashboard-footer">
      <div className="footer-content">
        <div className="footer-copyright">
          <span className="footer-copyright-text">© 2024 Valuez. All rights reserved.</span>
        </div>
        <div className="footer-links">
          <button 
            onClick={() => handleFooterLinkClick('terms')} 
            className="footer-link"
          >
            Terms
          </button>
          <button 
            onClick={() => handleFooterLinkClick('privacy')} 
            className="footer-link"
          >
            Privacy
          </button>
          <button 
            onClick={() => handleFooterLinkClick('contact')} 
            className="footer-link"
          >
            Contact
          </button>
          <button 
            onClick={() => handleFooterLinkClick('disclaimer')} 
            className="footer-link"
          >
            Disclaimer
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
