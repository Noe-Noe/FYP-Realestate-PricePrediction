import React, { useState } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './AddStep.css';
import api, { BACKEND_ORIGIN } from '../../services/api';

const AddStep = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [formData, setFormData] = useState({
    stepNumber: '',
    title: '',
    description: '',
    image: null,
    imagePreview: null,
    video: null,
    videoUrl: null,
    videoPreview: null
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        video: file
      }));

      // Create preview URL
      const videoUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        videoPreview: videoUrl
      }));
    }
  };

  const handleVideoUrlChange = (e) => {
    const url = e.target.value;
    // Prefix with backend URL if it's a relative path
    const previewUrl = url && url.startsWith('/') && !url.startsWith('//')
      ? `${BACKEND_ORIGIN}${url}` : url;
    setFormData(prev => ({
      ...prev,
      videoUrl: url,
      videoPreview: previewUrl
    }));
  };

  const handleUploadVideo = async () => {
    if (!formData.video) {
      alert('Please select a video file to upload');
      return;
    }

    try {
      setSaving(true);
      const response = await api.features.uploadVideo(formData.video);
      if (response.success) {
        // Prefix with backend URL if it's a relative path
        const fullVideoUrl = response.file_url.startsWith('/') && !response.file_url.startsWith('//')
          ? `${BACKEND_ORIGIN}${response.file_url}` : response.file_url;
        setFormData(prev => ({
          ...prev,
          videoUrl: response.file_url,
          videoPreview: fullVideoUrl
        }));
        setMessage('Video uploaded successfully!');
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      setMessage(`Error uploading video: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStep = async () => {
    try {
      setSaving(true);
      setMessage('');

      // Validate required fields
      if (!formData.title || !formData.description) {
        setMessage('Please fill in all required fields');
        return;
      }

      const stepData = {
        step_title: formData.title,
        step_description: formData.description,
        step_image: formData.imagePreview || '',
        step_video: formData.videoUrl || formData.videoPreview || ''
      };

      const response = await api.features.createStep(stepData);
      if (response.success) {
        setMessage('Step added successfully!');
        // Navigate back to edit how it works after a short delay
        setTimeout(() => {
          window.location.href = '/dashboard/edit-how-it-works';
        }, 1500);
      }
    } catch (error) {
      console.error('Error adding step:', error);
      setMessage(`Error adding step: ${error.message}`);
    } finally {
      setSaving(false);
    }
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

          {/* Message Display */}
          {message && (
            <div className={`add-step-message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

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
              <label className="add-step-form-label">Step Image</label>
              <div className="add-step-image-options">
                {/* Image URL Input */}
                <div className="add-step-form-group">
                  <label htmlFor="imageUrl" className="add-step-form-label">Image URL or Emoji</label>
                  <input
                    type="text"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imagePreview || ''}
                    onChange={handleImageUrlChange}
                    className="add-step-form-input"
                    placeholder="Enter image URL (https://...) or emoji (📝, 🔍, 💰)"
                  />
                </div>

                {/* File Upload */}
                <div className="add-step-form-group">
                  <label htmlFor="image" className="add-step-form-label">Or Upload Image File</label>
                  <div className="add-step-image-upload-section">
                    <input
                      type="file"
                      id="image"
                      name="image"
                      onChange={handleImageUpload}
                      className="add-step-file-input"
                      accept="image/*"
                    />
                    <label htmlFor="image" className="add-step-upload-btn">
                      Choose File
                    </label>
                  </div>
                </div>

                {/* Image Preview */}
                {formData.imagePreview && (
                  <div className="add-step-image-preview">
                    <label className="add-step-form-label">Preview</label>
                    <div className="add-step-preview-container">
                      {formData.imagePreview.startsWith('data:') || formData.imagePreview.startsWith('http') ? (
                        <img
                          src={formData.imagePreview}
                          alt="Step preview"
                          className="add-step-preview-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : (
                        <span className="add-step-emoji-preview">{formData.imagePreview}</span>
                      )}
                      <div className="add-step-preview-fallback" style={{ display: 'none' }}>
                        <span className="add-step-emoji-preview">{formData.imagePreview}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="add-step-form-group">
              <label className="add-step-form-label">Step Video</label>
              <div className="add-step-image-options">
                {/* Video URL Input */}
                <div className="add-step-form-group">
                  <label htmlFor="videoUrl" className="add-step-form-label">Video URL</label>
                  <input
                    type="text"
                    id="videoUrl"
                    name="videoUrl"
                    value={formData.videoUrl || ''}
                    onChange={handleVideoUrlChange}
                    className="add-step-form-input"
                    placeholder="Enter video URL (https://...)"
                  />
                </div>

                {/* File Upload */}
                <div className="add-step-form-group">
                  <label htmlFor="video" className="add-step-form-label">Or Upload Video File</label>
                  <div className="add-step-image-upload-section">
                    <input
                      type="file"
                      id="video"
                      name="video"
                      onChange={handleVideoUpload}
                      className="add-step-file-input"
                      accept="video/*"
                    />
                    <label htmlFor="video" className="add-step-upload-btn">
                      Choose Video File
                    </label>
                    {formData.video && (
                      <button
                        type="button"
                        onClick={handleUploadVideo}
                        className="add-step-upload-action-btn"
                        disabled={saving}
                      >
                        {saving ? 'Uploading...' : 'Upload Video'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Video Preview */}
                {formData.videoPreview && (
                  <div className="add-step-image-preview">
                    <label className="add-step-form-label">Preview</label>
                    <div className="add-step-preview-container">
                      <video
                        src={formData.videoPreview}
                        controls
                        className="add-step-preview-video"
                        style={{ maxWidth: '100%', maxHeight: '300px' }}
                      />
                    </div>
                  </div>
                )}
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
                disabled={saving}
              >
                {saving ? 'Adding...' : 'Add Step'}
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
