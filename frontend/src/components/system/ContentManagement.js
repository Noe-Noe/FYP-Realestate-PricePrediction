import React, { useState } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './ContentManagement.css';

const ContentManagement = () => {
  const [activeTab, setActiveTab] = useState('content');

  const contentSections = [
    {
      id: 'hero',
      title: 'Hero Section',
      description: 'Manage the main introductory section of the landing page.',
      category: 'Landing Page'
    },
    {
      id: 'how-it-works',
      title: 'How It Works Section',
      description: 'Edit the section explaining how the platform functions.',
      category: 'Landing Page'
    },
    {
      id: 'see-how-it-works',
      title: 'See How It Works Section',
      description: 'Manage the section that showcases the platform in action.',
      category: 'Landing Page'
    },
    {
      id: 'team',
      title: 'Our Team Section',
      description: 'Update information about the team behind the platform.',
      category: 'Landing Page'
    },
    {
      id: 'contact',
      title: 'Contact',
      description: 'Update contact information and messaging on the contact page.',
      category: 'Other Information'
    },
    {
      id: 'faq',
      title: 'FAQ',
      description: 'Edit frequently asked questions and their answers.',
      category: 'Other Information'
    },
    {
      id: 'disclaimer',
      title: 'Disclaimer',
      description: 'Manage the disclaimer text displayed on the platform.',
      category: 'Other Information'
    },
    {
      id: 'legal-terms',
      title: 'Legal Terms',
      description: 'Update the legal terms and conditions of the platform.',
      category: 'Other Information'
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      description: 'Manage the privacy policy and data protection information.',
      category: 'Other Information'
    },
    {
      id: 'subscription-plans',
      title: 'Subscription Plans',
      description: 'Manage subscription plans, pricing, and features.',
      category: 'Landing Page'
    }
  ];

  const handleEditSection = (sectionId) => {
    console.log('Edit section:', sectionId);
    // Navigate to edit section page
    if (sectionId === 'hero') {
      window.location.href = '/dashboard/edit-hero-section';
    } else if (sectionId === 'how-it-works') {
      window.location.href = '/dashboard/edit-how-it-works';
    } else if (sectionId === 'see-how-it-works') {
      window.location.href = '/dashboard/edit-see-how-it-works';
    } else if (sectionId === 'team') {
      window.location.href = '/dashboard/edit-our-team';
    } else if (sectionId === 'contact') {
      window.location.href = '/dashboard/edit-contact-section';
    } else if (sectionId === 'faq') {
      window.location.href = '/dashboard/edit-faq-section';
    } else if (sectionId === 'disclaimer') {
      window.location.href = '/dashboard/edit-disclaimer';
    } else if (sectionId === 'legal-terms') {
      window.location.href = '/dashboard/edit-legal-terms';
    } else if (sectionId === 'privacy') {
      window.location.href = '/dashboard/edit-privacy-policy';
    } else if (sectionId === 'subscription-plans') {
      window.location.href = '/dashboard/edit-subscription-plans';
    } else {
      window.location.href = `/dashboard/edit-section/${sectionId}`;
    }
  };

  const handlePreviewChanges = () => {
    console.log('Preview changes');
    // Navigate to preview page
    window.location.href = '/dashboard/content-preview';
  };

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          <div className="user-content-header">
            <h1 className="user-main-title">Content Management</h1>
                <button 
              className="content-management-preview-changes-btn"
              onClick={handlePreviewChanges}
                >
              Preview Changes
                </button>
              </div>
          <h2 className="content-management-sub-title">Landing Page</h2>
          <br></br>

          <div className="content-management-sections">
            {contentSections.map((section) => (
              <div key={section.id} className="content-management-section">
                <div className="content-management-section-info">
                  <h3 className="content-management-section-title">{section.title}</h3>
                  <p className="content-management-section-description">{section.description}</p>
                          <button 
                    className="content-management-edit-section-btn"
                    onClick={() => handleEditSection(section.id)}
                          >
                            Edit
                          </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default ContentManagement;
