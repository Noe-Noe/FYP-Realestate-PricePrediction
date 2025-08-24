import React, { useState } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './EditFAQSection.css';

const EditFAQSection = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [sectionTitle, setSectionTitle] = useState('Frequently Asked Questions');
  const [faqEntries, setFaqEntries] = useState([
    {
      id: 1,
      question: 'How do I list my property on the platform?',
      answer: 'What is the process for listing a property?'
    },
    {
      id: 2,
      question: 'What types of properties can I find on this platform?',
      answer: 'Our platform offers a wide range of commercial properties, including office spaces, retail locations, and industrial facilities.'
    },
    {
      id: 3,
      question: 'How can I contact customer support?',
      answer: 'You can contact us through the contact form on our website or by emailing our support team.'
    },
    {
      id: 4,
      question: 'Do you offer property management services?',
      answer: 'Yes, we offer property management services. Please contact us for more details.'
    }
  ]);

  const handleSectionTitleChange = (e) => {
    setSectionTitle(e.target.value);
  };

  const handleDeleteFAQ = (faqId) => {
    setFaqEntries(prev => prev.filter(faq => faq.id !== faqId));
  };

  const handleAddFAQ = () => {
    // Navigate to add FAQ page
    window.location.href = '/dashboard/add-faq';
  };

  const handleEditFAQ = (faqId) => {
    // Navigate to edit FAQ page
    window.location.href = `/dashboard/edit-faq/${faqId}`;
  };

  const handleSaveChanges = () => {
    console.log('Saving FAQ section changes:', { sectionTitle, faqEntries });
    // Add save logic here
    alert('FAQ section updated successfully!');
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

          {/* Form */}
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
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default EditFAQSection;
