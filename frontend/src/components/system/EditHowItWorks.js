import React, { useState, useEffect } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './EditHowItWorks.css';
import api, { BACKEND_ORIGIN } from '../../services/api';

const EditHowItWorks = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [sectionTitle, setSectionTitle] = useState('How it Works');
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [tutorialVideoUrl, setTutorialVideoUrl] = useState('');
  const [tutorialVideoFile, setTutorialVideoFile] = useState(null);
  const [tutorialVideoPreview, setTutorialVideoPreview] = useState(null);
  const [isFileUploaded, setIsFileUploaded] = useState(false);

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
          setSteps(stepsResponse.steps || []);
        } else {
          setMessage('Failed to load steps: ' + (stepsResponse.error || 'Unknown error'));
        }
        
        if (titleResponse.success) {
          setSectionTitle(titleResponse.section_title);
          const videoUrl = titleResponse.tutorial_video_url || '';
          setTutorialVideoUrl(videoUrl);
          // Prefix with backend URL if it's a relative path
          const previewUrl = videoUrl && videoUrl.startsWith('/') && !videoUrl.startsWith('//') 
            ? `${BACKEND_ORIGIN}${videoUrl}` : videoUrl;
          setTutorialVideoPreview(previewUrl);
          // If there's already a video URL, mark it as uploaded
          setIsFileUploaded(!!videoUrl);
        } else {
          setMessage('Failed to load section title: ' + (titleResponse.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error fetching features data:', error);
        setMessage('Error loading data: ' + error.message);
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

  const handleTutorialVideoUrlChange = (e) => {
    const url = e.target.value;
    setTutorialVideoUrl(url);
    // Prefix with backend URL if it's a relative path
    const previewUrl = url && url.startsWith('/') && !url.startsWith('//') 
      ? `${BACKEND_ORIGIN}${url}` : url;
    setTutorialVideoPreview(previewUrl);
    // Clear file selection when user enters URL
    if (url) {
      setTutorialVideoFile(null);
    }
    // If URL is provided, it's already "uploaded" (it's a URL)
    setIsFileUploaded(!!url);
  };

  const handleTutorialVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTutorialVideoFile(file);
      const videoUrl = URL.createObjectURL(file);
      setTutorialVideoPreview(videoUrl);
      setIsFileUploaded(false); // Reset upload status when new file is selected
    }
  };

  const handleUploadTutorialVideo = async () => {
    if (!tutorialVideoFile) {
      alert('Please select a video file to upload');
      return;
    }

    try {
      setSaving(true);
      const response = await api.features.uploadVideo(tutorialVideoFile);
      if (response.success) {
        setTutorialVideoUrl(response.file_url);
        // Prefix with backend URL if it's a relative path
        const previewUrl = response.file_url.startsWith('/') && !response.file_url.startsWith('//') 
          ? `${BACKEND_ORIGIN}${response.file_url}` : response.file_url;
        setTutorialVideoPreview(previewUrl);
        setIsFileUploaded(true); // Mark as uploaded
        setMessage('Tutorial video uploaded successfully!');
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (error) {
      console.error('Error uploading tutorial video:', error);
      setMessage(`Error uploading video: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      
      let finalVideoUrl = tutorialVideoUrl;
      
      // If user selected a file but hasn't uploaded it yet, upload it first
      if (tutorialVideoFile && !isFileUploaded) {
        try {
          const uploadResponse = await api.features.uploadVideo(tutorialVideoFile);
          if (uploadResponse.success) {
            finalVideoUrl = uploadResponse.file_url;
          } else {
            setMessage('Error uploading video file');
            return;
          }
        } catch (uploadError) {
          console.error('Error uploading video:', uploadError);
          setMessage('Error uploading video file: ' + uploadError.message);
          return;
        }
      }
      
      // Save section title with tutorial video URL
      const titleResponse = await api.features.updateSectionTitle(sectionTitle, finalVideoUrl);
      
      if (titleResponse.success) {
        setMessage('How It Works section updated successfully!');
        
        // Refresh the page to show updated content
        setTimeout(() => {
          window.location.reload();
        }, 2000);
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
                    {step.step_video && (
                      <div className="edit-how-it-works-step-video">
                        <video
                          src={step.step_video.startsWith('/') && !step.step_video.startsWith('//') ? 
                            `${BACKEND_ORIGIN}${step.step_video}` : step.step_video}
                          controls
                          style={{ width: '100%', maxHeight: '150px' }}
                        />
                      </div>
                    )}
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

            {/* Tutorial Video Section */}
            <div className="edit-how-it-works-tutorial-video-section">
              <h2 className="edit-how-it-works-tutorial-video-heading">Tutorial Video</h2>
              <p className="edit-how-it-works-tutorial-video-description">
                Upload a tutorial video that explains how to use the website (optional). You can either provide a video URL or upload a video file from your computer.
              </p>
              
              <div className="edit-how-it-works-tutorial-video-options">
                {/* Video URL Input */}
                <div className="edit-how-it-works-tutorial-video-form-group">
                  <label htmlFor="tutorialVideoUrl" className="edit-how-it-works-tutorial-video-label">Video URL</label>
                  <input
                    type="text"
                    id="tutorialVideoUrl"
                    value={tutorialVideoUrl}
                    onChange={handleTutorialVideoUrlChange}
                    className="edit-how-it-works-tutorial-video-input"
                    placeholder="Enter video URL (e.g., YouTube embed URL or direct video link)"
                  />
                </div>

                {/* File Upload */}
                <div className="edit-how-it-works-tutorial-video-form-group">
                  <label htmlFor="tutorialVideoFile" className="edit-how-it-works-tutorial-video-label">Or Upload Video File</label>
                  <div className="edit-how-it-works-tutorial-video-upload-section">
                    <input
                      type="file"
                      id="tutorialVideoFile"
                      onChange={handleTutorialVideoUpload}
                      className="edit-how-it-works-tutorial-video-file-input"
                      accept="video/*"
                    />
                    <label htmlFor="tutorialVideoFile" className="edit-how-it-works-tutorial-video-upload-btn">
                      Choose Video File
                    </label>
                    {tutorialVideoFile && (
                      <button
                        type="button"
                        onClick={handleUploadTutorialVideo}
                        className="edit-how-it-works-tutorial-video-upload-action-btn"
                        disabled={saving}
                      >
                        {saving ? 'Uploading...' : 'Upload Video'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Video Preview */}
                {tutorialVideoPreview && (
                  <div className="edit-how-it-works-tutorial-video-preview">
                    <label className="edit-how-it-works-tutorial-video-label">Preview</label>
                    <div className="edit-how-it-works-tutorial-video-preview-container">
                      <video
                        src={tutorialVideoPreview}
                        controls
                        className="edit-how-it-works-tutorial-video-preview-video"
                        style={{ maxWidth: '100%', maxHeight: '400px' }}
                      />
                    </div>
                  </div>
                )}
              </div>
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
