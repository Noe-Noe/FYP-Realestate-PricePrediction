import React, { useState, useEffect } from 'react';
import './Features.css';
import api from '../../services/api';

const Features = () => {
  const [steps, setSteps] = useState([]);
  const [sectionTitle, setSectionTitle] = useState('How it Works');
  const [loading, setLoading] = useState(true);

  // Fetch features steps and section title from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch both steps and section title in parallel
        const [stepsResponse, titleResponse] = await Promise.all([
          api.features.getSteps(),
          api.features.getSectionTitle()
        ]);
        
        if (stepsResponse.success) {
          setSteps(stepsResponse.steps);
        }
        
        if (titleResponse.success) {
          setSectionTitle(titleResponse.section_title);
        }
      } catch (error) {
        console.error('Error fetching features data:', error);
        // Fallback to empty array if API fails
        setSteps([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <section className="features" id="how">
      <h2 className="section-title">{sectionTitle}</h2>
      <div className="features-grid">
        {loading ? (
          <div className="features-loading">Loading steps...</div>
        ) : (
          steps.map((step) => (
            <div className="feature" key={step.id}>
              <h3>{step.step_title}</h3>
              <p>{step.step_description}</p>
              {step.step_image && (step.step_image.startsWith('http') || step.step_image.startsWith('data:')) ? (
                <img
                  src={step.step_image}
                  alt={step.step_title}
                  style={{ 
                    width: '60px', 
                    height: '60px', 
                    objectFit: 'cover', 
                    borderRadius: '8px',
                    display: 'block', 
                    margin: '0 auto 1rem auto' 
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : (
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>
                  {step.step_image}
                </span>
              )}
              <span style={{ fontSize: '3rem', display: 'none', marginBottom: '1rem' }}>
                {step.step_image}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default Features;
