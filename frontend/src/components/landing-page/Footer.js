import React, { useState, useEffect } from 'react';
import './Footer.css';
import logo from '../../logo.png';
import api from '../../services/api';

const Footer = () => {
  const [contactInfo, setContactInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modals, setModals] = useState({
    terms: false,
    privacy: false,
    disclaimer: false,
    contact: false
  });
  const [modalContent, setModalContent] = useState({
    terms: '',
    privacy: '',
    disclaimer: '',
    contact: ''
  });

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await api.contact.getInfo();
        if (response.success) {
          setContactInfo(response.contact_info);
        }
      } catch (error) {
        console.error('Error fetching contact info:', error);
        // Fallback to default contact info
        setContactInfo([
          { contact_type: 'phone', contact_value: '+(088) 123 456 789' },
          { contact_type: 'email', contact_value: 'hi@valuez.com' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchContactInfo();
  }, []);

  const openModal = async (modalType) => {
    try {
      let content = '';
      
      if (modalType === 'terms') {
        const response = await api.legal.getContent('terms_of_use');
        content = response.success ? response.data.content : 'Terms of Use content not available.';
      } else if (modalType === 'privacy') {
        const response = await api.legal.getContent('privacy_policy');
        content = response.success ? response.data.content : 'Privacy Policy content not available.';
      } else if (modalType === 'disclaimer') {
        const response = await api.legal.getContent('disclaimer');
        content = response.success ? response.data.content : 'Disclaimer content not available.';
      } else if (modalType === 'contact') {
        // For contact, we'll show the contact information
        content = contactInfo.map(item => 
          `${item.contact_type}: ${item.contact_value}`
        ).join('\n');
      }
      
      setModalContent(prev => ({ ...prev, [modalType]: content }));
      setModals(prev => ({ ...prev, [modalType]: true }));
    } catch (error) {
      console.error(`Error fetching ${modalType} content:`, error);
      setModalContent(prev => ({ 
        ...prev, 
        [modalType]: `${modalType} content not available.` 
      }));
      setModals(prev => ({ ...prev, [modalType]: true }));
    }
  };

  const closeModal = (modalType) => {
    setModals(prev => ({ ...prev, [modalType]: false }));
  };

  const renderContactItem = (item) => {
    const { contact_type, contact_value } = item;
    
    if (contact_type === 'phone') {
      return (
        <div className="contact-item" key={contact_type}>
          <div className="contact-label">Total Free Customer Care</div>
          <a href={`tel:${contact_value}`}>{contact_value}</a>
        </div>
      );
    } else if (contact_type === 'email') {
      return (
        <div className="contact-item" key={contact_type}>
          <div className="contact-label">Live Support?</div>
          <div className="contact-value">
            <a href={`mailto:${contact_value}`}>{contact_value}</a>
          </div>
        </div>
      );
    } else if (contact_type === 'hours') {
      return (
        <div className="contact-item" key={contact_type}>
          <div className="contact-label">Business Hours</div>
          <div className="contact-value">{contact_value}</div>
        </div>
      );
    } else {
      // Generic contact item
      return (
        <div className="contact-item" key={contact_type}>
          <div className="contact-label">{contact_type}</div>
          <div className="contact-value">{contact_value}</div>
        </div>
      );
    }
  };

  return (
    <footer className="footer">
      {/* Social Media Section */}
      <div className="social-media-section">
        <div className="social-container">
          <div className="social-logo">
            <img src={logo} alt="valuez logo" className="footer-logo-img" />
            <span className="footer-logo-text">valuez</span>
          </div>
          <div className="social-links">
            <span className="follow-text">Follow Us</span>
            <div className="social-icons">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.281h-1.281v1.281h1.281V7.707zm-3.323 1.281c-2.026 0-3.323 1.297-3.323 3.323s1.297 3.323 3.323 3.323 3.323-1.297 3.323-3.323-1.297-3.323-3.323-3.323z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="social-divider"></div>
      </div>

      {/* Main Footer Content */}
      <div className="footer-main">
        <div className="footer-container">
          {/* Contact Information */}
          <div className="footer-contact">
            {loading ? (
              <div className="contact-loading">Loading contact information...</div>
            ) : (
              contactInfo.map(renderContactItem)
            )}
          </div>

          {/* Quick Links */}
          <div className="footer-links">
            <h4 className="links-title">Quick Links</h4>
            <ul className="links-list">
              <li><button onClick={() => openModal('terms')} className="footer-link-btn">Terms of Use</button></li>
              <li><button onClick={() => openModal('privacy')} className="footer-link-btn">Privacy Policy</button></li>
              <li><button onClick={() => openModal('disclaimer')} className="footer-link-btn">Disclaimer</button></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <div className="copyright">
            <p>&copy; Valuez – All rights reserved</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modals.terms && (
        <div className="modal-overlay" onClick={() => closeModal('terms')}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Terms of Use</h3>
              <button className="modal-close" onClick={() => closeModal('terms')}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-text" dangerouslySetInnerHTML={{ __html: modalContent.terms.replace(/\n/g, '<br>') }} />
            </div>
          </div>
        </div>
      )}

      {modals.privacy && (
        <div className="modal-overlay" onClick={() => closeModal('privacy')}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Privacy Policy</h3>
              <button className="modal-close" onClick={() => closeModal('privacy')}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-text" dangerouslySetInnerHTML={{ __html: modalContent.privacy.replace(/\n/g, '<br>') }} />
            </div>
          </div>
        </div>
      )}

      {modals.disclaimer && (
        <div className="modal-overlay" onClick={() => closeModal('disclaimer')}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Disclaimer</h3>
              <button className="modal-close" onClick={() => closeModal('disclaimer')}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-text" dangerouslySetInnerHTML={{ __html: modalContent.disclaimer.replace(/\n/g, '<br>') }} />
            </div>
          </div>
        </div>
      )}

      {modals.contact && (
        <div className="modal-overlay" onClick={() => closeModal('contact')}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Contact Information</h3>
              <button className="modal-close" onClick={() => closeModal('contact')}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-text">{modalContent.contact}</div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
