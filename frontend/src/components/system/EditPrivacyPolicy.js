import React, { useState } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './EditPrivacyPolicy.css';

const EditPrivacyPolicy = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [privacyText, setPrivacyText] = useState(
    `Privacy Policy

Last updated: [Date]

This Privacy Policy describes how Valuez ("we," "us," or "our") collects, uses, and protects your personal information when you use our platform.

Information We Collect

We collect information you provide directly to us, such as when you create an account, submit inquiries, or contact us for support. This may include:
• Name and contact information
• Account credentials
• Property preferences and search history
• Communication records

How We Use Your Information

We use the information we collect to:
• Provide and maintain our services
• Process your requests and transactions
• Send you important updates and notifications
• Improve our platform and user experience
• Comply with legal obligations

Information Sharing

We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or as required by law.

Data Security

We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

Your Rights

You have the right to:
• Access your personal information
• Correct inaccurate information
• Request deletion of your data
• Opt-out of certain communications

Contact Us

If you have questions about this Privacy Policy, please contact us at privacy@valuez.com.

Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.`
  );

  const handleTextChange = (e) => {
    setPrivacyText(e.target.value);
  };

  const handleSaveChanges = () => {
    console.log('Saving privacy policy changes:', privacyText);
    // Add save logic here
    alert('Privacy Policy updated successfully!');
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
        <Navbar activeTab={activeTab} setActiveTab={activeTab} />
        <main className="user-main-content">
          {/* Breadcrumb */}
          <div className="edit-privacy-breadcrumb">
            Content Management / Privacy
          </div>

          {/* Page Title and Back Button */}
          <div className="edit-privacy-page-header">
            <div className="edit-privacy-page-title-section">
              <h1 className="user-main-title">Privacy</h1>
              <p className="edit-privacy-page-description">Update the privacy policy and data protection information</p>
            </div>
            <button 
              className="edit-privacy-back-btn"
              onClick={handleBack}
            >
              Back
            </button>
          </div>

          {/* Form */}
          <div className="edit-privacy-form">
            <div className="edit-privacy-form-group">
              <label htmlFor="privacyText" className="edit-privacy-form-label">Privacy Policy Text</label>
              <textarea
                id="privacyText"
                name="privacyText"
                value={privacyText}
                onChange={handleTextChange}
                className="edit-privacy-form-textarea"
                placeholder="Enter privacy policy text"
                rows="20"
              />
              <div className="edit-privacy-form-help">
                <p>Edit the privacy policy text that will be displayed to users. This text should include all necessary privacy information, data collection practices, and user rights.</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="edit-privacy-action-buttons">
              <button
                type="button"
                className="edit-privacy-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="edit-privacy-save-btn"
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

export default EditPrivacyPolicy;
