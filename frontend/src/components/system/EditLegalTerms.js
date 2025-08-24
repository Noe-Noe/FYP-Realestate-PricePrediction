import React, { useState } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './EditLegalTerms.css';

const EditLegalTerms = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [legalTermsText, setLegalTermsText] = useState(
    `TERMS AND CONDITIONS OF USE

1. ACCEPTANCE OF TERMS
By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.

2. DESCRIPTION OF SERVICE
This platform provides a marketplace for commercial property listings, connecting property owners with potential tenants and buyers. We provide information, tools, and services to facilitate property transactions.

3. USER ACCOUNTS AND REGISTRATION
To access certain features of the platform, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.

4. PROPERTY LISTINGS
Users may submit property listings for publication on the platform. You represent and warrant that all information provided in your listings is accurate, complete, and up-to-date. We reserve the right to review, modify, or remove any listing at our discretion.

5. USER CONDUCT
You agree not to use the platform to:
- Violate any applicable laws or regulations
- Infringe upon the rights of others
- Submit false or misleading information
- Engage in any fraudulent or deceptive practices
- Interfere with the proper functioning of the platform

6. INTELLECTUAL PROPERTY
The platform and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.

7. PRIVACY POLICY
Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the platform, to understand our practices.

8. DISCLAIMER OF WARRANTIES
The platform is provided "as is" without warranties of any kind, either express or implied. We do not warrant that the platform will be uninterrupted or error-free.

9. LIMITATION OF LIABILITY
In no event shall we be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.

10. MODIFICATIONS TO TERMS
We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new terms on the platform.

11. GOVERNING LAW
These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which we operate.

12. CONTACT INFORMATION
If you have any questions about these terms, please contact us through the platform's contact form.

Last updated: January 2024`
  );

  const handleTextChange = (e) => {
    setLegalTermsText(e.target.value);
  };

  const handleSaveChanges = () => {
    console.log('Saving legal terms changes:', legalTermsText);
    // Add save logic here
    alert('Legal terms updated successfully!');
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
          <div className="edit-legal-terms-breadcrumb">
            Content Management / Legal Terms
          </div>

          {/* Page Title and Back Button */}
          <div className="edit-legal-terms-page-header">
            <div className="edit-legal-terms-page-title-section">
              <h1 className="user-main-title">Legal Terms</h1>
              <p className="edit-legal-terms-page-description">Update the legal terms and conditions displayed on the platform</p>
            </div>
            <button 
              className="edit-legal-terms-back-btn"
              onClick={handleBack}
            >
              Back
            </button>
          </div>

          {/* Form */}
          <div className="edit-legal-terms-form">
            <div className="edit-legal-terms-form-group">
              <label htmlFor="legalTermsText" className="edit-legal-terms-form-label">Legal Terms and Conditions</label>
              <textarea
                id="legalTermsText"
                name="legalTermsText"
                value={legalTermsText}
                onChange={handleTextChange}
                className="edit-legal-terms-form-textarea"
                placeholder="Enter legal terms and conditions"
                rows="20"
              />
              <div className="edit-legal-terms-form-help">
                <p>Edit the legal terms and conditions that will be displayed to users. This text should include all necessary legal terms, user agreements, and platform policies.</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="edit-legal-terms-action-buttons">
              <button
                type="button"
                className="edit-legal-terms-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="edit-legal-terms-save-btn"
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

export default EditLegalTerms;
