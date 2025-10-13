import React, { useState, useEffect } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './EditHowItWorks.css';
import api from '../../services/api';

const EditHowItWorks = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [sectionTitle, setSectionTitle] = useState('How it Works');
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
        setMessage('Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSectionTitleChange = (e) => {
    setSectionTitle(e.target.value);
  };

  const handleStepEdit = (step) => {
    // Navigate to edit step page
    window.location.href = `/dashboard/edit-step/${step.id}`;
  };

  const handleStepDelete = async (step) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${step.step_title}"? This action cannot be undone.`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      const response = await api.features.deleteStep(step.id);
      
      if (response.success) {
        // Remove step from local state
        setSteps(prevSteps => prevSteps.filter(s => s.id !== step.id));
        setMessage('Step deleted successfully');
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error deleting step');
      }
    } catch (error) {
      console.error('Error deleting step:', error);
      setMessage('Error deleting step');
    } finally {
      setSaving(false);
    }
  };


  const handleAddStep = () => {
    // Navigate to add step page
    window.location.href = '/dashboard/add-step';
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      
      // Save section title
      const titleResponse = await api.features.updateSectionTitle(sectionTitle);
      
      if (titleResponse.success) {
        setMessage('How It Works section updated successfully!');
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error updating section title');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      setMessage('Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    console.log('Canceling changes');
    // Navigate back to content management
    window.location.href = '/dashboard/content-management';
  };

  const handleBack = () => {
    // Navigate back to content management
    window.location.href = '/dashboard/content-management';
  };

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          {/* Breadcrumb */}
          <div className="edit-how-it-works-breadcrumb">
            Content Management / Edit How It Works Section
          </div>

          {/* Page Title and Back Button */}
          <div className="edit-how-it-works-page-header">
            <h1 className="user-main-title">Edit How It Works Section</h1>
            <button 
              className="edit-how-it-works-back-btn"
              onClick={handleBack}
            >
              Back
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`edit-how-it-works-message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="edit-how-it-works-loading">
              Loading steps...
            </div>
          )}

          {/* Form */}
          <div className="edit-how-it-works-form">
            {/* Section Title */}
            <div className="edit-how-it-works-form-group">
              <label htmlFor="sectionTitle" className="edit-how-it-works-form-label">Section Title</label>
              <input
                type="text"
                id="sectionTitle"
                value={sectionTitle}
                onChange={handleSectionTitleChange}
                className="edit-how-it-works-form-input"
                placeholder="Enter section title"
              />
            </div>

            {/* Steps Section */}
            <div className="edit-how-it-works-steps-section">
              <h2 className="edit-how-it-works-steps-heading">Steps</h2>
              
              <div className="edit-how-it-works-steps-list">
                {steps.map((step) => (
                  <div key={step.id} className="edit-how-it-works-step-card">
                    <div className="edit-how-it-works-step-image">
                      {step.step_image && (step.step_image.startsWith('http') || step.step_image.startsWith('data:')) ? (
                        <img
                          src={step.step_image}
                          alt={`Step ${step.step_number}`}
                          className="edit-how-it-works-step-image-preview"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : (
                        <span className="edit-how-it-works-step-emoji">
                          {step.step_image}
                        </span>
                      )}
                      <span className="edit-how-it-works-step-emoji-fallback" style={{ display: 'none' }}>
                        {step.step_image}
                      </span>
                    </div>
                    <div className="edit-how-it-works-step-content">
                      <h3 className="edit-how-it-works-step-title">{step.step_title}</h3>
                      <p className="edit-how-it-works-step-description">{step.step_description}</p>
                      <span className="edit-how-it-works-step-label">Step {step.step_number}</span>
                    </div>
                    <div className="edit-how-it-works-step-actions">
                      <button 
                        className="edit-how-it-works-edit-step-btn"
                        onClick={() => handleStepEdit(step)}
                        title="Edit Step"
                      >
                        ✏️
                      </button>
                      <button 
                        className="edit-how-it-works-delete-step-btn"
                        onClick={() => handleStepDelete(step)}
                        title="Delete Step"
                        disabled={saving}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                className="edit-how-it-works-add-step-btn"
                onClick={handleAddStep}
              >
                Add Step
              </button>
            </div>

            {/* Action Buttons */}
            <div className="edit-how-it-works-action-buttons">
              <button
                type="button"
                className="edit-how-it-works-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="edit-how-it-works-save-btn"
                onClick={handleSaveChanges}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default EditHowItWorks;
