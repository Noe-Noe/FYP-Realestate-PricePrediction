import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './EditStep.css';

const EditStep = () => {
  const { stepId } = useParams();
  const [activeTab, setActiveTab] = useState('content');
  const [formData, setFormData] = useState({
    stepNumber: '',
    title: '',
    description: '',
    image: null,
    imagePreview: null
  });

  // Mock data for steps - in a real app, this would come from an API
  const mockSteps = [
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
  ];

  useEffect(() => {
    // Find the step data based on stepId
    const step = mockSteps.find(s => s.id === parseInt(stepId));
    if (step) {
      setFormData({
        stepNumber: step.stepNumber.toString(),
        title: step.title,
        description: step.description,
        image: null,
        imagePreview: step.image
      });
    }
  }, [stepId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));

      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          imagePreview: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveStep = () => {
    console.log('Saving step changes:', formData);
    // Add save logic here
    alert('Step updated successfully!');
    // Navigate back to edit how it works
    window.location.href = '/dashboard/edit-how-it-works';
  };

  const handleCancel = () => {
    console.log('Canceling step changes');
    // Navigate back to edit how it works
    window.location.href = '/dashboard/edit-how-it-works';
  };

  const handleBack = () => {
    // Navigate back to edit how it works
    window.location.href = '/dashboard/edit-how-it-works';
  };

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          {/* Breadcrumb */}
          <div className="edit-step-breadcrumb">
            Content Management / How It Works Section / Edit Step {stepId}
          </div>

          {/* Page Title and Back Button */}
          <div className="edit-step-page-header">
            <h1 className="user-main-title">Edit Step {stepId}</h1>
            <button 
              className="edit-step-back-btn"
              onClick={handleBack}
            >
              Back
            </button>
          </div>

          {/* Form */}
          <div className="edit-step-form">
            <div className="edit-step-form-group">
              <label htmlFor="stepNumber" className="edit-step-form-label">Step Number</label>
              <input
                type="number"
                id="stepNumber"
                name="stepNumber"
                value={formData.stepNumber}
                onChange={handleInputChange}
                className="edit-step-form-input"
                placeholder="Enter step number"
                min="1"
              />
            </div>

            <div className="edit-step-form-group">
              <label htmlFor="title" className="edit-step-form-label">Step Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="edit-step-form-input"
                placeholder="Enter step title"
              />
            </div>

            <div className="edit-step-form-group">
              <label htmlFor="description" className="edit-step-form-label">Step Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="edit-step-form-textarea"
                placeholder="Enter step description"
                rows="4"
              />
            </div>

            <div className="edit-step-form-group">
              <label htmlFor="image" className="edit-step-form-label">Step Image</label>
              <div className="edit-step-image-upload-section">
                {formData.imagePreview && (
                  <div className="edit-step-image-preview">
                    <img
                      src={formData.imagePreview}
                      alt="Step preview"
                      className="edit-step-preview-image"
                    />
                  </div>
                )}
                <input
                  type="file"
                  id="image"
                  name="image"
                  onChange={handleImageUpload}
                  className="edit-step-file-input"
                  accept="image/*"
                />
                <label htmlFor="image" className="edit-step-upload-btn">
                  {formData.imagePreview ? 'Change Image' : 'Upload Step Image'}
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="edit-step-action-buttons">
              <button
                type="button"
                className="edit-step-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="edit-step-save-btn"
                onClick={handleSaveStep}
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

export default EditStep;
