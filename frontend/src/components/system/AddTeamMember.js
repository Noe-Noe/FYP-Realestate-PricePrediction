import React, { useState } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './AddTeamMember.css';

const AddTeamMember = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    image: null,
    imagePreview: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));

      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          imagePreview: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTeamMember = () => {
    console.log('Saving new team member:', formData);
    // Add save logic here
    alert('Team member added successfully!');
    // Navigate back to edit our team
    window.location.href = '/dashboard/edit-our-team';
  };

  const handleCancel = () => {
    console.log('Canceling team member addition');
    // Navigate back to edit our team
    window.location.href = '/dashboard/edit-our-team';
  };

  const handleBack = () => {
    // Navigate back to edit our team
    window.location.href = '/dashboard/edit-our-team';
  };

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          {/* Breadcrumb */}
          <div className="add-team-member-breadcrumb">
            Content Management / Our Team Section / Add Team Member
          </div>

          {/* Page Title and Back Button */}
          <div className="add-team-member-page-header">
            <h1 className="user-main-title">Add New Team Member</h1>
            <button 
              className="add-team-member-back-btn"
              onClick={handleBack}
            >
              Back
            </button>
          </div>

          {/* Form */}
          <div className="add-team-member-form">
            <div className="add-team-member-form-group">
              <label htmlFor="name" className="add-team-member-form-label">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="add-team-member-form-input"
                placeholder="Enter full name"
              />
            </div>

            <div className="add-team-member-form-group">
              <label htmlFor="role" className="add-team-member-form-label">Role/Position</label>
              <input
                type="text"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="add-team-member-form-input"
                placeholder="Enter role or position"
              />
            </div>

            <div className="add-team-member-form-group">
              <label htmlFor="image" className="add-team-member-form-label">Profile Image</label>
              <div className="add-team-member-image-upload-section">
                {formData.imagePreview && (
                  <div className="add-team-member-image-preview">
                    <img
                      src={formData.imagePreview}
                      alt="Profile preview"
                      className="add-team-member-preview-image"
                    />
                  </div>
                )}
                <input
                  type="file"
                  id="image"
                  name="image"
                  onChange={handleImageUpload}
                  className="add-team-member-file-input"
                  accept="image/*"
                />
                <label htmlFor="image" className="add-team-member-upload-btn">
                  {formData.imagePreview ? 'Change Image' : 'Upload Profile Image'}
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="add-team-member-action-buttons">
              <button
                type="button"
                className="add-team-member-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="add-team-member-save-btn"
                onClick={handleSaveTeamMember}
              >
                Add Team Member
              </button>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AddTeamMember;
