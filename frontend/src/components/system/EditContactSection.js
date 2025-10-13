import React, { useState, useEffect } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './EditContactSection.css';
import api from '../../services/api';

const EditContactSection = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [contactInfo, setContactInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        setLoading(true);
        const response = await api.contact.getInfo();
        
        if (response.success) {
          setContactInfo(response.contact_info);
        } else {
          setMessage('Error loading contact information');
        }
      } catch (error) {
        console.error('Error fetching contact info:', error);
        setMessage('Error loading contact information');
      } finally {
        setLoading(false);
      }
    };

    fetchContactInfo();
  }, []);

  const handleContactChange = (index, field, value) => {
    const updatedContactInfo = [...contactInfo];
    updatedContactInfo[index][field] = value;
    setContactInfo(updatedContactInfo);
  };

  const addContactItem = () => {
    setContactInfo([...contactInfo, {
      contact_type: '',
      contact_value: '',
      display_order: contactInfo.length
    }]);
  };

  const removeContactItem = (index) => {
    const updatedContactInfo = contactInfo.filter((_, i) => i !== index);
    setContactInfo(updatedContactInfo);
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      setMessage('');

      // Validate contact info
      const validContactInfo = contactInfo.filter(item => 
        item.contact_type.trim() && item.contact_value.trim()
      );

      if (validContactInfo.length === 0) {
        setMessage('Error: At least one contact item is required');
        return;
      }

      const response = await api.contact.updateInfo({
        contact_info: validContactInfo
      });

      if (response.success) {
        setMessage('Contact information updated successfully!');
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } else {
        setMessage(`Error updating contact information: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving contact information:', error);
      setMessage(`Error updating contact information: ${error.message || 'Network error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    console.log('Canceling contact section changes');
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
          <div className="edit-contact-section-breadcrumb">
            Content Management / Contact Section
          </div>

          {/* Page Title and Back Button */}
          <div className="edit-contact-section-page-header">
            <h1 className="user-main-title">Edit Contact Section</h1>
            <button 
              className="edit-contact-section-back-btn"
              onClick={handleBack}
            >
              Back
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`edit-contact-section-message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="edit-contact-section-loading">
              Loading contact information...
            </div>
          )}

          {/* Contact Information Form */}
          {!loading && (
            <div className="edit-contact-section-form">
              <div className="edit-contact-section-section">
                <h2 className="edit-contact-section-section-title">Contact Information</h2>
                <p className="edit-contact-section-section-description">
                  Manage the contact information displayed in the footer of your website.
                </p>

                <div className="edit-contact-section-items">
                  {contactInfo.map((item, index) => (
                    <div key={index} className="edit-contact-section-item">
                      <div className="edit-contact-section-item-header">
                        <h3>Contact Item {index + 1}</h3>
                        <button
                          type="button"
                          className="edit-contact-section-remove-btn"
                          onClick={() => removeContactItem(index)}
                          disabled={saving}
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="edit-contact-section-form-group">
                        <label htmlFor={`contact_type_${index}`}>Contact Type</label>
                        <select
                          id={`contact_type_${index}`}
                          value={item.contact_type}
                          onChange={(e) => handleContactChange(index, 'contact_type', e.target.value)}
                          disabled={saving}
                        >
                          <option value="">Select contact type</option>
                          <option value="phone">Phone</option>
                          <option value="email">Email</option>
                          <option value="address">Address</option>
                          <option value="hours">Business Hours</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="edit-contact-section-form-group">
                        <label htmlFor={`contact_value_${index}`}>Contact Value</label>
                        <input
                          type="text"
                          id={`contact_value_${index}`}
                          value={item.contact_value}
                          onChange={(e) => handleContactChange(index, 'contact_value', e.target.value)}
                          placeholder="Enter contact information"
                          disabled={saving}
                        />
                      </div>

                      <div className="edit-contact-section-form-group">
                        <label htmlFor={`display_order_${index}`}>Display Order</label>
                        <input
                          type="number"
                          id={`display_order_${index}`}
                          value={item.display_order}
                          onChange={(e) => handleContactChange(index, 'display_order', parseInt(e.target.value) || 0)}
                          disabled={saving}
                          min="0"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="edit-contact-section-add-btn"
                    onClick={addContactItem}
                    disabled={saving}
                  >
                    Add Contact Item
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="edit-contact-section-action-buttons">
            <button 
              className="edit-contact-section-cancel-btn"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              className="edit-contact-section-save-btn"
              onClick={handleSaveChanges}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default EditContactSection;