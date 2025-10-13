import React, { useState, useEffect } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './EditHeroSection.css';
import api, { BACKEND_ORIGIN } from '../../services/api';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({ background: false, video: false });
  const [message, setMessage] = useState('');

  // Fetch current hero content from API
  useEffect(() => {
    const fetchHeroContent = async () => {
      try {
        setLoading(true);
        const response = await api.hero.getContent();
        if (response.success) {
          const content = response.hero_content;
          
          // Convert relative URLs to full URLs for display
          const backgroundUrl = content.hero_background_url 
            ? (content.hero_background_url.startsWith('/admin/') 
                ? `${BACKEND_ORIGIN}${content.hero_background_url}` 
                : content.hero_background_url)
            : '/hero-background.jpg';
            
          const videoUrl = content.marketing_video_url 
            ? (content.marketing_video_url.startsWith('/admin/') 
                ? `${BACKEND_ORIGIN}${content.marketing_video_url}` 
                : content.marketing_video_url)
            : '/marketing-video.jpg';
          
          setFormData({
            headline: content.headline || '',
            subheading: content.subheading || '',
            backgroundImage: backgroundUrl,
            marketingVideo: videoUrl,
            buttonText: content.button_text || '',
            buttonUrl: content.button_url || ''
          });
        }
      } catch (error) {
        console.error('Error fetching hero content:', error);
        setMessage('Error loading hero content');
      } finally {
        setLoading(false);
      }
    };

    fetchHeroContent();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setUploading(prev => ({ ...prev, background: true }));
        setMessage('');

        const response = await api.hero.uploadBackground(file);
        if (response.success) {
          // Convert relative URL to full URL for display
          const fullUrl = response.file_url.startsWith('/admin/') 
            ? `${BACKEND_ORIGIN}${response.file_url}` 
            : response.file_url;
          
          setFormData(prev => ({
            ...prev,
            backgroundImage: fullUrl
          }));
          setMessage('Background image uploaded successfully!');
        }
      } catch (error) {
        console.error('Error uploading background image:', error);
        setMessage(`Error uploading background image: ${error.message}`);
      } finally {
        setUploading(prev => ({ ...prev, background: false }));
      }
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setUploading(prev => ({ ...prev, video: true }));
        setMessage('');

        const response = await api.hero.uploadVideo(file);
        if (response.success) {
          // Convert relative URL to full URL for display
          const fullUrl = response.file_url.startsWith('/admin/') 
            ? `http://localhost:5000${response.file_url}` 
            : response.file_url;
          
          setFormData(prev => ({
            ...prev,
            marketingVideo: fullUrl
          }));
          setMessage('Marketing video uploaded successfully! Saving to hero content...');

          // Immediately persist the new video URL to backend so landing page reflects it
          const backgroundUrlForSave = formData.backgroundImage && formData.backgroundImage.startsWith('http://localhost:5000/admin/')
            ? formData.backgroundImage.replace('http://localhost:5000', '')
            : formData.backgroundImage;

          const videoUrlForSave = fullUrl.startsWith('http://localhost:5000/admin/')
            ? fullUrl.replace('http://localhost:5000', '')
            : fullUrl;

          const contentData = {
            headline: formData.headline,
            subheading: formData.subheading,
            hero_background_url: backgroundUrlForSave,
            marketing_video_url: videoUrlForSave,
            button_text: formData.buttonText,
            button_url: formData.buttonUrl
          };

          try {
            const saveResp = await api.hero.updateContent(contentData);
            if (saveResp.success) {
              setMessage('Marketing video uploaded and saved successfully!');
            }
          } catch (saveErr) {
            console.error('Error auto-saving video URL:', saveErr);
            setMessage(`Video uploaded, but failed to save content: ${saveErr.message}`);
          }
        }
      } catch (error) {
        console.error('Error uploading video:', error);
        setMessage(`Error uploading video: ${error.message}`);
      } finally {
        setUploading(prev => ({ ...prev, video: false }));
      }
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      setMessage('');

      // Convert full URLs back to relative URLs for database storage
      const backgroundUrl = formData.backgroundImage.startsWith(`${BACKEND_ORIGIN}/admin/`) 
        ? formData.backgroundImage.replace(BACKEND_ORIGIN, '') 
        : formData.backgroundImage;
      
      const videoUrl = formData.marketingVideo.startsWith(`${BACKEND_ORIGIN}/admin/`) 
        ? formData.marketingVideo.replace(BACKEND_ORIGIN, '') 
        : formData.marketingVideo;

      const contentData = {
        headline: formData.headline,
        subheading: formData.subheading,
        hero_background_url: backgroundUrl,
        marketing_video_url: videoUrl,
        button_text: formData.buttonText,
        button_url: formData.buttonUrl
      };

      const response = await api.hero.updateContent(contentData);
      if (response.success) {
        setMessage('Hero section updated successfully!');
      }
    } catch (error) {
      console.error('Error updating hero content:', error);
      setMessage(`Error updating content: ${error.message}`);
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

          {/* Message Display */}
          {message && (
            <div className={`edit-hero-message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="edit-hero-loading">
              Loading hero content...
            </div>
          )}

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
                    {uploading.background ? 'Uploading...' : 'Upload New Image'}
                  </label>
                </div>
              </div>
            </div>

            {/* Marketing Video */}
            <div className="edit-hero-form-group">
              <label className="edit-hero-form-label">Marketing Video</label>
              <div className="edit-hero-image-preview-container">
                {formData.marketingVideo && (formData.marketingVideo.endsWith('.mp4') || formData.marketingVideo.endsWith('.webm') || formData.marketingVideo.endsWith('.ogg') || formData.marketingVideo.startsWith('http')) ? (
                  <video src={formData.marketingVideo} className="edit-hero-background-preview" controls muted playsInline />
                ) : (
                  <img
                    src={formData.marketingVideo}
                    alt="Marketing video"
                    className="edit-hero-background-preview"
                  />
                )}
                <div className="edit-hero-image-upload-section">
                  <input
                    type="file"
                    id="video-upload"
                    accept="video/*,image/*"
                    onChange={handleVideoUpload}
                    className="edit-hero-file-input"
                  />
                  <label htmlFor="video-upload" className="edit-hero-upload-btn">
                    {uploading.video ? 'Uploading...' : 'Upload New Video'}
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

export default EditHeroSection;
