import React, { useState } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './AddStep.css';

const AddStep = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [formData, setFormData] = useState({
    stepNumber: '',
    title: '',
    description: '',
    image: null,
    imagePreview: null
  });

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
    console.log('Saving new step:', formData);
    // Add save logic here
    alert('Step added successfully!');
    // Navigate back to edit how it works
    window.location.href = '/dashboard/edit-how-it-works';
  };

  const handleCancel = () => {
    console.log('Canceling step addition');
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
          <div className="add-step-breadcrumb">
            Content Management / How It Works Section / Add Step
          </div>

          {/* Page Title and Back Button */}
          <div className="add-step-page-header">
            <h1 className="user-main-title">Add New Step</h1>
            <button 
              className="add-step-back-btn"
              onClick={handleBack}
            >
              Back
            </button>
          </div>

          {/* Form */}
          <div className="add-step-form">
            <div className="add-step-form-group">
              <label htmlFor="stepNumber" className="add-step-form-label">Step Number</label>
              <input
                type="number"
                id="stepNumber"
                name="stepNumber"
                value={formData.stepNumber}
                onChange={handleInputChange}
                className="add-step-form-input"
                placeholder="Enter step number"
                min="1"
              />
            </div>

            <div className="add-step-form-group">
              <label htmlFor="title" className="add-step-form-label">Step Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="add-step-form-input"
                placeholder="Enter step title"
              />
            </div>

            <div className="add-step-form-group">
              <label htmlFor="description" className="add-step-form-label">Step Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="add-step-form-textarea"
                placeholder="Enter step description"
                rows="4"
              />
            </div>

            <div className="add-step-form-group">
              <label htmlFor="image" className="add-step-form-label">Step Image</label>
              <div className="add-step-image-upload-section">
                {formData.imagePreview && (
                  <div className="add-step-image-preview">
                    <img
                      src={formData.imagePreview}
                      alt="Step preview"
                      className="add-step-preview-image"
                    />
                  </div>
                )}
                <input
                  type="file"
                  id="image"
                  name="image"
                  onChange={handleImageUpload}
                  className="add-step-file-input"
                  accept="image/*"
                />
                <label htmlFor="image" className="add-step-upload-btn">
                  {formData.imagePreview ? 'Change Image' : 'Upload Image'}
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="add-step-action-buttons">
              <button
                type="button"
                className="add-step-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="add-step-save-btn"
                onClick={handleSaveStep}
              >
                Add Step
              </button>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AddStep;
