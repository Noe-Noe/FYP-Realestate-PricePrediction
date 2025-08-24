import React, { useState } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './EditHowItWorks.css';

const EditHowItWorks = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [sectionTitle, setSectionTitle] = useState('');
  const [steps, setSteps] = useState([
    {
      id: 1,
      title: 'Find Your Space',
      description: 'Description for step 1',
      image: '/step1-image.jpg',
      stepNumber: 1
    },
    {
      id: 2,
      title: 'Connect with Brokers',
      description: 'Description for step 2',
      image: '/step2-image.jpg',
      stepNumber: 2
    },
    {
      id: 3,
      title: 'Secure Your Lease',
      description: 'Description for step 3',
      image: '/step3-image.jpg',
      stepNumber: 3
    }
  ]);

  const handleSectionTitleChange = (e) => {
    setSectionTitle(e.target.value);
  };

  const handleStepEdit = (stepId) => {
    console.log('Edit step:', stepId);
    // Navigate to edit step page
    window.location.href = `/dashboard/edit-step/${stepId}`;
  };

  const handleStepDelete = (stepId) => {
    if (window.confirm('Are you sure you want to delete this step?')) {
      setSteps(prev => prev.filter(step => step.id !== stepId));
      console.log('Deleted step:', stepId);
    }
  };

  const handleAddStep = () => {
    // Navigate to add step page
    window.location.href = '/dashboard/add-step';
  };

  const handleSaveChanges = () => {
    console.log('Saving how it works section changes:', { sectionTitle, steps });
    // Add save logic here
    alert('How It Works section updated successfully!');
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
                      <img
                        src={step.image}
                        alt={`Step ${step.stepNumber}`}
                        className="edit-how-it-works-step-thumbnail"
                      />
                    </div>
                    <div className="edit-how-it-works-step-content">
                      <h3 className="edit-how-it-works-step-title">{step.title}</h3>
                      <p className="edit-how-it-works-step-description">{step.description}</p>
                      <span className="edit-how-it-works-step-label">Step {step.stepNumber}</span>
                    </div>
                    <div className="edit-how-it-works-step-actions">
                      <button 
                        className="edit-how-it-works-edit-step-btn"
                        onClick={() => handleStepEdit(step.id)}
                        title="Edit Step"
                      >
                        ✏️
                      </button>
                      <button 
                        className="edit-how-it-works-delete-step-btn"
                        onClick={() => handleStepDelete(step.id)}
                        title="Delete Step"
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
              >
                Save Changes
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
