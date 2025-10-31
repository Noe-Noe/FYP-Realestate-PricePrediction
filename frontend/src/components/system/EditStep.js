import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './EditStep.css';
import api from '../../services/api';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchStep = async () => {
      try {
        setLoading(true);
        const response = await api.features.getStep(stepId);
        if (response.success) {
          const step = response.step;
          setFormData({
            stepNumber: step.step_number.toString(),
            title: step.step_title,
            description: step.step_description,
            image: null,
            imagePreview: step.step_image
          });
        }
      } catch (error) {
        console.error('Error fetching step:', error);
        setMessage('Error loading step');
      } finally {
        setLoading(false);
      }
    };

    if (stepId) {
      fetchStep();
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

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({
      ...prev,
      imagePreview: url
    }));
  };

  const handleSaveStep = async () => {
    try {
      setSaving(true);
      setMessage('');

      const stepData = {
        step_title: formData.title,
        step_description: formData.description,
        step_image: formData.imagePreview
      };

      const response = await api.features.updateStep(stepId, stepData);
      if (response.success) {
        setMessage('Step updated successfully!');
        // Navigate back to edit how it works after a short delay
        setTimeout(() => {
          window.location.href = '/dashboard/edit-how-it-works';
        }, 1500);
      }
    } catch (error) {
      console.error('Error updating step:', error);
      setMessage(`Error updating step: ${error.message}`);
    } finally {
      setSaving(false);
    }
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

          {/* Message Display */}
          {message && (
            <div className={`edit-step-message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="edit-step-loading">
              Loading step...
            </div>
          )}

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
              <label className="edit-step-form-label">Step Image</label>
              <div className="edit-step-image-options">
                {/* Image URL Input */}
                <div className="edit-step-form-group">
                  <label htmlFor="imageUrl" className="edit-step-form-label">Image URL or Emoji</label>
                  <input
                    type="text"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imagePreview || ''}
                    onChange={handleImageUrlChange}
                    className="edit-step-form-input"
                    placeholder="Enter image URL (https://...) or emoji (📝, 🔍, 💰)"
                  />
                </div>

                {/* File Upload */}
                <div className="edit-step-form-group">
                  <label htmlFor="image" className="edit-step-form-label">Or Upload Image File</label>
                  <div className="edit-step-image-upload-section">
                    <input
                      type="file"
                      id="image"
                      name="image"
                      onChange={handleImageUpload}
                      className="edit-step-file-input"
                      accept="image/*"
                    />
                    <label htmlFor="image" className="edit-step-upload-btn">
                      Choose File
                    </label>
                  </div>
                </div>

                {/* Image Preview */}
                {formData.imagePreview && (
                  <div className="edit-step-image-preview">
                    <label className="edit-step-form-label">Preview</label>
                    <div className="edit-step-preview-container">
                      {formData.imagePreview.startsWith('data:') || formData.imagePreview.startsWith('http') ? (
                        <img
                          src={formData.imagePreview}
                          alt="Step preview"
                          className="edit-step-preview-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : (
                        <span className="edit-step-emoji-preview">{formData.imagePreview}</span>
                      )}
                      <div className="edit-step-preview-fallback" style={{ display: 'none' }}>
                        <span className="edit-step-emoji-preview">{formData.imagePreview}</span>
                      </div>
                    </div>
                  </div>
                )}
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

export default EditStep;
