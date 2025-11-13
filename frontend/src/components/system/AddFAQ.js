import React, { useState } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import api from '../../services/api';
import './AddFAQ.css';

const AddFAQ = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveFAQ = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      if (!formData.question.trim() || !formData.answer.trim()) {
        setMessage({ type: 'error', text: 'Question and answer are required' });
        return;
      }

      const response = await api.faq.createEntry(formData);
      
      if (response.success) {
        setMessage({ type: 'success', text: 'FAQ added successfully!' });
        // Navigate back after a short delay
        setTimeout(() => {
          window.location.href = '/dashboard/edit-faq-section';
        }, 1500);
      } else {
        setMessage({ type: 'error', text: 'Failed to add FAQ' });
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      setMessage({ type: 'error', text: 'Failed to add FAQ' });
    } finally {
      setLoading(false);
    }
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

          {/* Message Display */}
          {message.text && (
            <div className={`component-message ${message.type}`}>
              {message.text}
            </div>
          )}

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
              <label htmlFor="category" className="add-faq-form-label">Category (Optional)</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="add-faq-form-input"
                placeholder="Enter category (e.g., General, Features, Support)"
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
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save FAQ'}
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
