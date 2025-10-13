import React, { useState, useEffect } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import api from '../../services/api';
import './EditDisclaimer.css';

const EditDisclaimer = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [disclaimerText, setDisclaimerText] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch disclaimer content on component mount
  useEffect(() => {
    fetchDisclaimerContent();
  }, []);

  const fetchDisclaimerContent = async () => {
    try {
      setLoading(true);
      const response = await api.legal.getContent('disclaimer');
      
      if (response.success && response.data) {
        setDisclaimerText(response.data.content || '');
      } else {
        // Use default content if no content found
        setDisclaimerText(`This platform is provided "as is" without any warranties, express or implied. We make no representations about the accuracy, completeness, or reliability of any information, products, services, or related graphics contained on this platform for any purpose.

All information provided on this platform is for general informational purposes only and should not be considered as professional advice. Users should consult with qualified professionals before making any decisions based on the information provided.

We reserve the right to modify, suspend, or discontinue any part of this platform at any time without notice. We shall not be liable for any damages arising from the use or inability to use this platform.

By using this platform, you agree to these terms and acknowledge that you use the platform at your own risk.`);
      }
    } catch (error) {
      console.error('Error fetching disclaimer content:', error);
      setMessage({ type: 'error', text: 'Failed to load disclaimer content' });
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (e) => {
    setDisclaimerText(e.target.value);
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const response = await api.legal.updateContent('disclaimer', {
        title: 'Disclaimer',
        content: disclaimerText,
        version: '1.0'
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Disclaimer updated successfully!' });
        // Clear message after 3 seconds
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to update disclaimer' });
      }
    } catch (error) {
      console.error('Error saving disclaimer:', error);
      setMessage({ type: 'error', text: 'Failed to update disclaimer' });
    } finally {
      setLoading(false);
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
          <div className="edit-disclaimer-breadcrumb">
            Content Management / Disclaimer
          </div>

          {/* Page Title and Back Button */}
          <div className="edit-disclaimer-page-header">
            <div className="edit-disclaimer-page-title-section">
              <h1 className="user-main-title">Edit Disclaimer</h1>
              <p className="edit-disclaimer-page-description">Update the disclaimer text displayed on the platform</p>
            </div>
            <button 
              className="edit-disclaimer-back-btn"
              onClick={handleBack}
            >
              Back
            </button>
          </div>

          {/* Message Display */}
          {message.text && (
            <div className={`component-message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Form */}
          <div className="edit-disclaimer-form">
            {loading ? (
              <div className="edit-disclaimer-loading">
                <p>Loading disclaimer content...</p>
              </div>
            ) : (
              <div className="edit-disclaimer-form-group">
                <label htmlFor="disclaimerText" className="edit-disclaimer-form-label">Disclaimer Text</label>
                <textarea
                  id="disclaimerText"
                  name="disclaimerText"
                  value={disclaimerText}
                  onChange={handleTextChange}
                  className="edit-disclaimer-form-textarea"
                  placeholder="Enter disclaimer text"
                  rows="15"
                />
                <div className="edit-disclaimer-form-help">
                  <p>Edit the disclaimer text that will be displayed to users. This text should include all necessary legal disclaimers and terms.</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!loading && (
              <div className="edit-disclaimer-action-buttons">
                <button
                  type="button"
                  className="edit-disclaimer-cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="edit-disclaimer-save-btn"
                  onClick={handleSaveChanges}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default EditDisclaimer;
