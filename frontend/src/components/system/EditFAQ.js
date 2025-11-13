import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import api from '../../services/api';
import './EditFAQ.css';

const EditFAQ = () => {
  const { faqId } = useParams();
  const [activeTab, setActiveTab] = useState('content');
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: ''
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchFAQData();
  }, [faqId]);

  const fetchFAQData = async () => {
    try {
      setLoading(true);
      const response = await api.faq.getEntry(faqId);
      
      if (response.success) {
        const faq = response.faq;
        setFormData({
          question: faq.question,
          answer: faq.answer,
          category: faq.category || ''
        });
      } else {
        setMessage({ type: 'error', text: 'Failed to load FAQ data' });
      }
    } catch (error) {
      console.error('Error fetching FAQ data:', error);
      setMessage({ type: 'error', text: 'Failed to load FAQ data' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveFAQ = async () => {
    try {
      setMessage({ type: '', text: '' });
      
      if (!formData.question.trim() || !formData.answer.trim()) {
        setMessage({ type: 'error', text: 'Question and answer are required' });
        return;
      }

      const response = await api.faq.updateEntry(faqId, formData);
      
      if (response.success) {
        setMessage({ type: 'success', text: 'FAQ updated successfully!' });
        // Navigate back after a short delay
        setTimeout(() => {
          window.location.href = '/dashboard/edit-faq-section';
        }, 1500);
      } else {
        setMessage({ type: 'error', text: 'Failed to update FAQ' });
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      setMessage({ type: 'error', text: 'Failed to update FAQ' });
    }
  };

  const handleCancel = () => {
    console.log('Canceling FAQ changes');
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
          <div className="edit-faq-breadcrumb">
            Content Management / FAQ Section / Edit FAQ {faqId}
          </div>

          {/* Page Title and Back Button */}
          <div className="edit-faq-page-header">
            <h1 className="user-main-title">Edit FAQ {faqId}</h1>
            <button 
              className="edit-faq-back-btn"
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
            <div className="edit-faq-loading">
              <p>Loading FAQ data...</p>
            </div>
          ) : (
            /* Form */
            <div className="edit-faq-form">
              <div className="edit-faq-form-group">
                <label htmlFor="question" className="edit-faq-form-label">Question</label>
                <input
                  type="text"
                  id="question"
                  name="question"
                  value={formData.question}
                  onChange={handleInputChange}
                  className="edit-faq-form-input"
                  placeholder="Enter the question"
                />
              </div>

              <div className="edit-faq-form-group">
                <label htmlFor="category" className="edit-faq-form-label">Category (Optional)</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="edit-faq-form-input"
                  placeholder="Enter category (e.g., General, Features, Support)"
                />
              </div>

              <div className="edit-faq-form-group">
                <label htmlFor="answer" className="edit-faq-form-label">Answer</label>
                <textarea
                  id="answer"
                  name="answer"
                  value={formData.answer}
                  onChange={handleInputChange}
                  className="edit-faq-form-textarea"
                  placeholder="Enter the answer"
                  rows="6"
                />
              </div>

              {/* Action Buttons */}
              <div className="edit-faq-action-buttons">
                <button
                  type="button"
                  className="edit-faq-cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="edit-faq-save-btn"
                  onClick={handleSaveFAQ}
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

export default EditFAQ;
