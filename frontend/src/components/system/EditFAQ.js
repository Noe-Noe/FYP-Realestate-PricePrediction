import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './EditFAQ.css';

const EditFAQ = () => {
  const { faqId } = useParams();
  const [activeTab, setActiveTab] = useState('content');
  const [formData, setFormData] = useState({
    question: '',
    answer: ''
  });

  // Mock data for FAQs - in a real app, this would come from an API
  const mockFAQs = [
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
  ];

  useEffect(() => {
    // Find the FAQ data based on faqId
    const faq = mockFAQs.find(f => f.id === parseInt(faqId));
    if (faq) {
      setFormData({
        question: faq.question,
        answer: faq.answer
      });
    }
  }, [faqId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveFAQ = () => {
    console.log('Saving FAQ changes:', formData);
    // Add save logic here
    alert('FAQ updated successfully!');
    // Navigate back to edit FAQ section
    window.location.href = '/dashboard/edit-faq-section';
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

          {/* Form */}
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
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default EditFAQ;
