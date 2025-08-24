import React, { useState } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './EditHeroSection.css';

const EditHeroSection = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [formData, setFormData] = useState({
    headline: '',
    subheading: '',
    backgroundImage: '/hero-background.jpg',
    marketingVideo: '/marketing-video.jpg',
    buttonText: '',
    buttonUrl: ''
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
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          backgroundImage: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          marketingVideo: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    console.log('Saving hero section changes:', formData);
    // Add save logic here
    alert('Hero section updated successfully!');
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
          <div className="edit-hero-breadcrumb">
            Content Management / Edit Hero Section
          </div>

          {/* Page Title and Back Button */}
          <div className="edit-hero-page-header">
            <h1 className="user-main-title">Edit Hero Section</h1>
            <button 
              className="edit-hero-back-btn"
              onClick={handleBack}
            >
              Back
            </button>
          </div>

          {/* Form */}
          <div className="edit-hero-form">
            {/* Headline */}
            <div className="edit-hero-form-group">
              <label htmlFor="headline" className="edit-hero-form-label">Headline</label>
              <input
                type="text"
                id="headline"
                name="headline"
                value={formData.headline}
                onChange={handleInputChange}
                className="edit-hero-form-input"
                placeholder="Enter headline"
              />
            </div>

            {/* Subheading */}
            <div className="edit-hero-form-group">
              <label htmlFor="subheading" className="edit-hero-form-label">Subheading</label>
              <textarea
                id="subheading"
                name="subheading"
                value={formData.subheading}
                onChange={handleInputChange}
                className="edit-hero-form-textarea"
                placeholder="Enter subheading"
                rows={3}
              />
            </div>

            {/* Background Image */}
            <div className="edit-hero-form-group">
              <label className="edit-hero-form-label">Background Image</label>
              <div className="edit-hero-image-preview-container">
                <img
                  src={formData.backgroundImage}
                  alt="Hero background"
                  className="edit-hero-background-preview"
                />
                <div className="edit-hero-image-upload-section">
                  <input
                    type="file"
                    id="background-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="edit-hero-file-input"
                  />
                  <label htmlFor="background-upload" className="edit-hero-upload-btn">
                    Upload New Image
                  </label>
                </div>
              </div>
            </div>

            {/* Marketing Video */}
            <div className="edit-hero-form-group">
              <label className="edit-hero-form-label">Marketing Video</label>
              <div className="edit-hero-image-preview-container">
                <img
                  src={formData.marketingVideo}
                  alt="Marketing video"
                  className="edit-hero-background-preview"
                />
                <div className="edit-hero-image-upload-section">
                  <input
                    type="file"
                    id="video-upload"
                    accept="image/*,video/*"
                    onChange={handleVideoUpload}
                    className="edit-hero-file-input"
                  />
                  <label htmlFor="video-upload" className="edit-hero-upload-btn">
                    Upload New Video
                  </label>
                </div>
              </div>
            </div>

            {/* Button Text */}
            <div className="edit-hero-form-group">
              <label htmlFor="buttonText" className="edit-hero-form-label">Button Text</label>
              <input
                type="text"
                id="buttonText"
                name="buttonText"
                value={formData.buttonText}
                onChange={handleInputChange}
                className="edit-hero-form-input"
                placeholder="Enter button text"
              />
            </div>

            {/* Button URL */}
            <div className="edit-hero-form-group">
              <label htmlFor="buttonUrl" className="edit-hero-form-label">Button URL</label>
              <input
                type="url"
                id="buttonUrl"
                name="buttonUrl"
                value={formData.buttonUrl}
                onChange={handleInputChange}
                className="edit-hero-form-input"
                placeholder="Enter button URL"
              />
            </div>

            {/* Action Buttons */}
            <div className="edit-hero-action-buttons">
              <button
                type="button"
                className="edit-hero-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="edit-hero-save-btn"
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

export default EditHeroSection;
