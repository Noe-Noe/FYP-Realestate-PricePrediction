import React, { useState, useEffect } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import api from '../../services/api';
import './EditFAQSection.css';

const EditFAQSection = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [sectionTitle, setSectionTitle] = useState('Frequently Asked Questions');
  const [faqEntries, setFaqEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch FAQ section and entries on component mount
  useEffect(() => {
    fetchFAQData();
  }, []);

  const fetchFAQData = async () => {
    try {
      setLoading(true);
      const [sectionResponse, entriesResponse] = await Promise.all([
        api.faq.getSection(),
        api.faq.getEntries()
      ]);

      if (sectionResponse.success) {
        setSectionTitle(sectionResponse.section.section_title);
      }

      if (entriesResponse.success) {
        setFaqEntries(entriesResponse.faqs);
      }
    } catch (error) {
      console.error('Error fetching FAQ data:', error);
      setMessage({ type: 'error', text: 'Failed to load FAQ data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSectionTitleChange = (e) => {
    setSectionTitle(e.target.value);
  };

  const handleDeleteFAQ = async (faqId) => {
    if (window.confirm('Are you sure you want to delete this FAQ entry?')) {
      try {
        const response = await api.faq.deleteEntry(faqId);
        if (response.success) {
          setFaqEntries(prev => prev.filter(faq => faq.id !== faqId));
          setMessage({ type: 'success', text: 'FAQ entry deleted successfully' });
        } else {
          setMessage({ type: 'error', text: 'Failed to delete FAQ entry' });
        }
      } catch (error) {
        console.error('Error deleting FAQ entry:', error);
        setMessage({ type: 'error', text: 'Failed to delete FAQ entry' });
      }
    }
  };

  const handleAddFAQ = () => {
    // Navigate to add FAQ page
    window.location.href = '/dashboard/add-faq';
  };

  const handleEditFAQ = (faqId) => {
    // Navigate to edit FAQ page
    window.location.href = `/dashboard/edit-faq/${faqId}`;
  };

  const handleSaveChanges = async () => {
    try {
      setMessage({ type: '', text: '' });
      
      const response = await api.faq.updateSection({ section_title: sectionTitle });
      
      if (response.success) {
        setMessage({ type: 'success', text: 'FAQ section updated successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update FAQ section' });
      }
    } catch (error) {
      console.error('Error saving FAQ section:', error);
      setMessage({ type: 'error', text: 'Failed to update FAQ section' });
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
          <div className="edit-faq-section-breadcrumb">
            Content Management / FAQ Section
          </div>

          {/* Page Title and Back Button */}
          <div className="edit-faq-section-page-header">
            <div className="edit-faq-section-page-title-section">
              <h1 className="user-main-title">Frequently Asked Questions</h1>
              <p className="edit-faq-section-page-description">Manage the FAQs displayed on the website</p>
            </div>
            <button 
              className="edit-faq-section-back-btn"
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

          {/* Loading State */}
          {loading ? (
            <div className="edit-faq-section-loading">
              <p>Loading FAQ data...</p>
            </div>
          ) : (
            /* Form */
            <div className="edit-faq-section-form">
              {/* FAQ Section Title */}
              <div className="edit-faq-section-form-group">
                <label htmlFor="sectionTitle" className="edit-faq-section-form-label">FAQ Section Title</label>
                <input
                  type="text"
                  id="sectionTitle"
                  name="sectionTitle"
                  value={sectionTitle}
                  onChange={handleSectionTitleChange}
                  className="edit-faq-section-form-input"
                  placeholder="Enter FAQ section title"
                />
              </div>

            {/* FAQ Entries */}
            <div className="edit-faq-section-form-group">
              <label className="edit-faq-section-form-label">FAQ Entries</label>
              <div className="edit-faq-section-entries-list">
                {faqEntries.map((faq) => (
                  <div key={faq.id} className="edit-faq-section-entry">
                    <div className="edit-faq-section-content">
                      <div className="edit-faq-section-question">{faq.question}</div>
                      <div className="edit-faq-section-answer">{faq.answer}</div>
                    </div>
                    <div className="edit-faq-section-actions">
                      <button
                        className="edit-faq-section-edit-faq-btn"
                        onClick={() => handleEditFAQ(faq.id)}
                      >
                        Edit
                      </button>
                      <button
                        className="edit-faq-section-delete-faq-btn"
                        onClick={() => handleDeleteFAQ(faq.id)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add New FAQ Button */}
              <button
                className="edit-faq-section-add-faq-btn"
                onClick={handleAddFAQ}
              >
                Add New FAQ
              </button>
            </div>

              {/* Action Buttons */}
              <div className="edit-faq-section-action-buttons">
                <button
                  type="button"
                  className="edit-faq-section-cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="edit-faq-section-save-btn"
                  onClick={handleSaveChanges}
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default EditFAQSection;
