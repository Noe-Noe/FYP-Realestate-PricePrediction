import React, { useState } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './EditContactSection.css';

const EditContactSection = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [formData, setFormData] = useState({
    companyName: 'PropertyConnect Solutions',
    physicalAddress: '123 Business District, Suite 456, Downtown, City Center 12345',
    phoneNumber: '+1 (555) 123-4567',
    emailAddress: 'info@propertyconnectsolutions.com',
    contactFormRecipientEmail: 'contact@propertyconnectsolutions.com'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = () => {
    console.log('Saving contact section changes:', formData);
    // Add save logic here
    alert('Contact information updated successfully!');
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
          <div className="edit-contact-breadcrumb">
            Content Management / Contact
          </div>

          {/* Page Title and Back Button */}
          <div className="edit-contact-page-header">
            <h1 className="user-main-title">Edit Contact Information</h1>
            <button 
              className="edit-contact-back-btn"
              onClick={handleBack}
            >
              Back
            </button>
          </div>

          {/* Form */}
          <div className="edit-contact-form">
            {/* Company Name */}
            <div className="edit-contact-form-group">
              <label htmlFor="companyName" className="edit-contact-form-label">Company Name</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="edit-contact-form-input"
                placeholder="Enter company name"
              />
            </div>

            {/* Physical Address */}
            <div className="edit-contact-form-group">
              <label htmlFor="physicalAddress" className="edit-contact-form-label">Physical Address</label>
              <input
                type="text"
                id="physicalAddress"
                name="physicalAddress"
                value={formData.physicalAddress}
                onChange={handleInputChange}
                className="edit-contact-form-input"
                placeholder="Enter physical address"
              />
            </div>

            {/* Phone Number */}
            <div className="edit-contact-form-group">
              <label htmlFor="phoneNumber" className="edit-contact-form-label">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="edit-contact-form-input"
                placeholder="Enter phone number"
              />
            </div>

            {/* Email Address */}
            <div className="edit-contact-form-group">
              <label htmlFor="emailAddress" className="edit-contact-form-label">Email Address</label>
              <input
                type="email"
                id="emailAddress"
                name="emailAddress"
                value={formData.emailAddress}
                onChange={handleInputChange}
                className="edit-contact-form-input"
                placeholder="Enter email address"
              />
            </div>

            {/* Contact Form Recipient Email */}
            <div className="edit-contact-form-group">
              <label htmlFor="contactFormRecipientEmail" className="edit-contact-form-label">Contact Form Recipient Email</label>
              <input
                type="email"
                id="contactFormRecipientEmail"
                name="contactFormRecipientEmail"
                value={formData.contactFormRecipientEmail}
                onChange={handleInputChange}
                className="edit-contact-form-input"
                placeholder="Enter contact form recipient email"
              />
            </div>

            {/* Action Buttons */}
            <div className="edit-contact-action-buttons">
              <button
                type="button"
                className="edit-contact-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="edit-contact-save-btn"
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

export default EditContactSection;
