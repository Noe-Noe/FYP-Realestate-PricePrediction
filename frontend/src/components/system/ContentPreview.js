import React, { useState } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './ContentPreview.css';

// Import actual landing page components
import Hero from '../landing-page/Hero';
import Explore from '../landing-page/Explore';
import Features from '../landing-page/Features';
import Reviews from '../landing-page/Reviews';
import SubscriptionPlans from '../landing-page/SubscriptionPlans';
import FAQ from '../landing-page/FAQ';
import Team from '../landing-page/Team';
import LandingFooter from '../landing-page/Footer';
import '../Landing.css';

const ContentPreview = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [activeContentTab, setActiveContentTab] = useState('landing-page');

  // Mock data for preview - in a real app, this would come from the edited content
  const previewData = {
    contact: {
      companyName: 'Valuez',
      physicalAddress: '123 Business District, Suite 456, Downtown, Singapore 12345',
      phoneNumber: '+65 (555) 123-4567',
      emailAddress: 'info@valuez.com',
      contactFormRecipientEmail: 'contact@valuez.com'
    },
    faq: {
      title: 'Frequently Asked Questions',
      entries: [
        {
          id: 1,
          question: 'How do I list my property on the platform?',
          answer: 'To list your property, simply create an agent account and use our listing management tools to add property details, photos, and pricing information.'
        },
        {
          id: 2,
          question: 'What types of properties can I find on this platform?',
          answer: 'Our platform offers a wide range of commercial properties, including office spaces, retail locations, industrial facilities, and mixed-use developments.'
        },
        {
          id: 3,
          question: 'How can I contact customer support?',
          answer: 'You can contact us through the contact form on our website, by emailing our support team, or by calling our dedicated support line.'
        }
      ]
    },
    disclaimer: `This platform is provided "as is" without any warranties, express or implied. We make no representations about the accuracy, completeness, or reliability of any information, products, services, or related graphics contained on this platform for any purpose.

All information provided on this platform is for general informational purposes only and should not be considered as professional advice. Users should consult with qualified professionals before making any decisions based on the information provided.

We reserve the right to modify, suspend, or discontinue any part of this platform at any time without notice. We shall not be liable for any damages arising from the use or inability to use this platform.

By using this platform, you agree to these terms and acknowledge that you use the platform at your own risk.`,
    legalTerms: `TERMS AND CONDITIONS OF USE

1. ACCEPTANCE OF TERMS
By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement.

2. USE LICENSE
Permission is granted to temporarily download one copy of the materials (information or software) on Valuez's website for personal, non-commercial transitory viewing only.

3. DISCLAIMER
The materials on Valuez's website are provided on an 'as is' basis. Valuez makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.

4. LIMITATIONS
In no event shall Valuez or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Valuez's website.`,
    privacy: `Privacy Policy

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
  };

  const handlePublishChanges = () => {
    console.log('Publishing changes to live site');
    alert('Changes have been published successfully!');
    // Navigate back to content management
    window.location.href = '/dashboard/content-management';
  };

  const handleBack = () => {
    // Navigate back to content management
    window.location.href = '/dashboard/content-management';
  };

  const renderLandingPagePreview = () => (
    <div className="content-preview-section">
      <h3 className="content-preview-section-title">Landing Page Preview</h3>
      
      {/* Hero Section */}
      <div className="content-preview-landing-section">
        <h4 className="content-preview-section-subtitle">Hero Section</h4>
        <Hero />
      </div>

      {/* Explore Section */}
      <div className="content-preview-landing-section">
        <h4 className="content-preview-section-subtitle">Explore Section</h4>
        <div className="section-shadow">
          <Explore />
        </div>
      </div>

      {/* Features Section */}
      <div className="content-preview-landing-section">
        <h4 className="content-preview-section-subtitle">How It Works Section</h4>
        <div className="section-shadow">
          <Features />
        </div>
      </div>

      {/* Reviews Section */}
      <div className="content-preview-landing-section">
        <h4 className="content-preview-section-subtitle">Reviews Section</h4>
        <div className="section-shadow">
          <Reviews />
        </div>
      </div>

      {/* Subscription Plans Section */}
      <div className="content-preview-landing-section">
        <h4 className="content-preview-section-subtitle">Subscription Plans Section</h4>
        <div className="section-shadow">
          <SubscriptionPlans />
        </div>
      </div>

      {/* FAQ Section */}
      <div className="content-preview-landing-section">
        <h4 className="content-preview-section-subtitle">FAQ Section</h4>
        <div className="section-shadow">
          <FAQ />
        </div>
      </div>

      {/* Team Section */}
      <div className="content-preview-landing-section">
        <h4 className="content-preview-section-subtitle">Our Team Section</h4>
        <div className="section-shadow">
          <Team />
        </div>
      </div>

      {/* Footer */}
      <div className="content-preview-landing-section">
        <h4 className="content-preview-section-subtitle">Footer</h4>
        <LandingFooter />
      </div>
    </div>
  );

  const renderContactPreview = () => (
    <div className="content-preview-section">
      <h3 className="content-preview-section-title">Contact Information Preview</h3>
      <div className="content-preview-contact-preview">
        <h4>{previewData.contact.companyName}</h4>
        <p><strong>Address:</strong> {previewData.contact.physicalAddress}</p>
        <p><strong>Phone:</strong> {previewData.contact.phoneNumber}</p>
        <p><strong>Email:</strong> {previewData.contact.emailAddress}</p>
        <p><strong>Contact Form Recipient:</strong> {previewData.contact.contactFormRecipientEmail}</p>
      </div>
    </div>
  );

  const renderFAQPreview = () => (
    <div className="content-preview-section">
      <h3 className="content-preview-section-title">FAQ Preview</h3>
      <div className="content-preview-faq-preview">
        <h4>{previewData.faq.title}</h4>
        {previewData.faq.entries.map((faq) => (
          <div key={faq.id} className="content-preview-faq-item">
            <h5>Q: {faq.question}</h5>
            <p>A: {faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );



  const renderDisclaimerPreview = () => (
    <div className="content-preview-section">
      <h3 className="content-preview-section-title">Disclaimer Preview</h3>
      <div className="content-preview-disclaimer-preview">
        <p>{previewData.disclaimer}</p>
      </div>
    </div>
  );

  const renderLegalTermsPreview = () => (
    <div className="content-preview-section">
      <h3 className="content-preview-section-title">Legal Terms Preview</h3>
      <div className="content-preview-legal-terms-preview">
        <pre>{previewData.legalTerms}</pre>
      </div>
    </div>
  );

  const renderPrivacyPreview = () => (
    <div className="content-preview-section">
      <h3 className="content-preview-section-title">Privacy Policy Preview</h3>
      <div className="content-preview-privacy-preview">
        <pre>{previewData.privacy}</pre>
      </div>
    </div>
  );



  const renderContent = () => {
    switch (activeContentTab) {
      case 'landing-page':
        return renderLandingPagePreview();
      case 'contact':
        return renderContactPreview();
      case 'faq':
        return renderFAQPreview();
      case 'disclaimer':
        return renderDisclaimerPreview();
      case 'legal-terms':
        return renderLegalTermsPreview();
      case 'privacy':
        return renderPrivacyPreview();

      default:
        return renderLandingPagePreview();
    }
  };

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          {/* Breadcrumb */}
          <div className="content-preview-breadcrumb">
            Content Management / Content Preview
          </div>

          {/* Page Title and Back Button */}
          <div className="content-preview-page-header">
            <div className="content-preview-page-title-section">
              <h1 className="user-main-title">Content Preview</h1>
              <p className="content-preview-page-description">Review all changes before publishing to the live site</p>
            </div>
            <button 
              className="content-preview-back-btn"
              onClick={handleBack}
            >
              Back
            </button>
          </div>

          {/* Content Type Tabs */}
          <div className="content-preview-tabs">
            <button 
              className={`content-preview-tab ${activeContentTab === 'landing-page' ? 'active' : ''}`}
              onClick={() => setActiveContentTab('landing-page')}
            >
              Landing Page
            </button>
            <button 
              className={`content-preview-tab ${activeContentTab === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveContentTab('contact')}
            >
              Contact
            </button>
            <button 
              className={`content-preview-tab ${activeContentTab === 'faq' ? 'active' : ''}`}
              onClick={() => setActiveContentTab('faq')}
            >
              FAQ
            </button>
            <button 
              className={`content-preview-tab ${activeContentTab === 'disclaimer' ? 'active' : ''}`}
              onClick={() => setActiveContentTab('disclaimer')}
            >
              Disclaimer
            </button>
            <button 
              className={`content-preview-tab ${activeContentTab === 'legal-terms' ? 'active' : ''}`}
              onClick={() => setActiveContentTab('legal-terms')}
            >
              Legal Terms
            </button>
            <button 
              className={`content-preview-tab ${activeContentTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveContentTab('privacy')}
            >
              Privacy Policy
            </button>
          </div>

          {/* Preview Content */}
          <div className="content-preview-content">
            {renderContent()}
          </div>

          {/* Publish Button */}
          <div className="content-preview-publish-section">
            <button 
              className="content-preview-publish-btn"
              onClick={handlePublishChanges}
            >
              Publish Changes
            </button>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default ContentPreview;
