import React from 'react';
import './Hero.css';
import heroBackground from '../../hero.png';

const Hero = () => {
  return (
    <section id="home" className="hero-section">
      <div
        className="hero-background"
        style={{
          backgroundImage: `url(${heroBackground})`,
        }}
      >
        <div className="hero-overlay">
          <div className="hero-content">
            {/* Left Side - Text and Buttons */}
            <div className="hero-left">
              <div className="hero-text">
                <h1 className="hero-title">
                  Smarter Property Insights.<br />Backed by Data.
                </h1>
                <p className="hero-subtitle">
                  Unlock Accurate Property Value — Instantly.
                </p>
              </div>
              <div className="hero-actions">
                <a href="/login" className="hero-btn">
                  <span>Login to get Started</span>
                  <div className="btn-icon">
                    <svg
                      width="18"
                      height="17"
                      viewBox="0 0 18 17"
                      fill="none"
                    >
                      <path
                        d="M9 1L17 8.5L9 16M17 8.5H1"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </a>
              </div>
            </div>

            {/* Right Side - Video */}
            <div className="hero-right">
              <video className="hero-video" autoPlay muted loop>
                <source
                  src="http://localhost:3845/assets/marketing-video.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
