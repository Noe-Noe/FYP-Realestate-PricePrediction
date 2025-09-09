import React, { useState, useEffect } from 'react';
import './Hero.css';
import heroBackground from '../../hero.png';
import api, { BACKEND_ORIGIN } from '../../services/api';

const Hero = () => {
  const [heroContent, setHeroContent] = useState({
    headline: 'Smarter Property Insights.<br />Backed by Data.',
    subheading: 'Unlock Accurate Property Value — Instantly.',
    hero_background_url: heroBackground,
    marketing_video_url: '',
    button_text: 'Login to get Started',
    button_url: '/login'
  });
  const [loading, setLoading] = useState(true);

  // Fetch hero content from API
  useEffect(() => {
    const fetchHeroContent = async () => {
      try {
        setLoading(true);
        const response = await api.hero.getContent();
        if (response.success) {
          const content = response.hero_content;
          // Convert relative URLs to full URLs for uploaded files
          if (content.hero_background_url && content.hero_background_url.startsWith('/admin/')) {
            content.hero_background_url = `${BACKEND_ORIGIN}${content.hero_background_url}`;
          }
          if (content.marketing_video_url && content.marketing_video_url.startsWith('/admin/')) {
            content.marketing_video_url = `${BACKEND_ORIGIN}${content.marketing_video_url}`;
          }
          setHeroContent(content);
        }
      } catch (error) {
        console.error('Error fetching hero content:', error);
        // Keep default content if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchHeroContent();
  }, []);

  return (
    <section id="home" className="hero-section">
      <div
        className="hero-background"
        style={{
          backgroundImage: `url(${heroContent.hero_background_url || heroBackground})`,
        }}
      >
        <div className="hero-overlay">
          <div className="hero-content">
            {/* Left Side - Text and Buttons */}
            <div className="hero-left">
              <div className="hero-text">
                <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: heroContent.headline }}>
                </h1>
                <p className="hero-subtitle">
                  {heroContent.subheading}
                </p>
              </div>
              <div className="hero-actions">
                <a href={heroContent.button_url} className="hero-btn">
                  <span>{heroContent.button_text}</span>
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
              {heroContent.marketing_video_url && (
                <video className="hero-video" autoPlay muted loop playsInline controls>
                  <source src={heroContent.marketing_video_url} />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
