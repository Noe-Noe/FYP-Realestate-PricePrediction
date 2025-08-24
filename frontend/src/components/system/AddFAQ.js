import React, { useState } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './AddFAQ.css';

const AddFAQ = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [formData, setFormData] = useState({
    question: '',
    answer: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveFAQ = () => {
    console.log('Saving new FAQ:', formData);
    // Add save logic here
    alert('FAQ added successfully!');
    // Navigate back to edit FAQ section
    window.location.href = '/dashboard/edit-faq-section';
  };

  const handleCancel = () => {
    console.log('Canceling FAQ addition');
    // Navigate back to edit FAQ section
    window.location.href = '/dashboard/edit-faq-section';
  };

  const handleBack = () => {
    // Navigate back to edit FAQ section
    window.location.href = '/dashboard/edit-faq-section';
  };

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          {/* Breadcrumb */}
          <div className="add-faq-breadcrumb">
            Content Management / FAQ Section / Add New FAQ
          </div>

          {/* Page Title and Back Button */}
          <div className="add-faq-page-header">
            <h1 className="user-main-title">Add New FAQ</h1>
            <button 
              className="add-faq-back-btn"
              onClick={handleBack}
            >
              Back
            </button>
          </div>

          {/* Form */}
          <div className="add-faq-form">
            <div className="add-faq-form-group">
              <label htmlFor="question" className="add-faq-form-label">Question</label>
              <input
                type="text"
                id="question"
                name="question"
                value={formData.question}
                onChange={handleInputChange}
                className="add-faq-form-input"
                placeholder="Enter the question"
              />
            </div>

            <div className="add-faq-form-group">
              <label htmlFor="answer" className="add-faq-form-label">Answer</label>
              <textarea
                id="answer"
                name="answer"
                value={formData.answer}
                onChange={handleInputChange}
                className="add-faq-form-textarea"
                placeholder="Enter the answer"
                rows="6"
              />
            </div>

            {/* Action Buttons */}
            <div className="add-faq-action-buttons">
              <button
                type="button"
                className="add-faq-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="add-faq-save-btn"
                onClick={handleSaveFAQ}
              >
                Save FAQ
              </button>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AddFAQ;
