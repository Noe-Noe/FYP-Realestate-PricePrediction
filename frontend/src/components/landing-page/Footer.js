import React from 'react';
import './Footer.css';
import logo from '../../logo.png';

const Footer = () => {
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
              <span className="social-icon">📘</span>
              <span className="social-icon">🐦</span>
              <span className="social-icon">📷</span>
              <span className="social-icon">💼</span>
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
            <div className="contact-item">
              <div className="contact-label">Total Free Customer Care</div>
              <a href="tel:+088123456789">+(088) 123 456 789</a>
              </div>
            <div className="contact-item">
              <div className="contact-label">Live Support?</div>
              <div className="contact-value">
              <a href="mailto:hi@valuez.com">hi@valuez.com</a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-links">
            <h4 className="links-title">Quick Links</h4>
            <ul className="links-list">
              <li><a href="#terms">Terms of Use</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#pricing">Pricing Plans</a></li>
              <li><a href="#contact">Contact</a></li>
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
          <div className="footer-bottom-links">
            <a href="#privacy">Privacy</a>
            <span className="separator">|</span>
            <a href="#terms">Terms</a>
            <span className="separator">|</span>
            <a href="#sitemap">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
