import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './EditTeamMember.css';

const EditTeamMember = () => {
  const { memberId } = useParams();
  const [activeTab, setActiveTab] = useState('content');
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    image: null,
    imagePreview: null
  });

  // Mock data for team members - in a real app, this would come from an API
  const mockTeamMembers = [
    {
      id: 1,
      name: 'Ethan Carter',
      role: 'CEO',
      image: '/ethan-carter.jpg'
    },
    {
      id: 2,
      name: 'Sophia Bennett',
      role: 'Head of Sales',
      image: '/sophia-bennett.jpg'
    },
    {
      id: 3,
      name: 'Liam Harper',
      role: 'Lead Developer',
      image: '/liam-harper.jpg'
    },
    {
      id: 4,
      name: 'Olivia Hayes',
      role: 'Marketing Manager',
      image: '/olivia-hayes.jpg'
    }
  ];

  useEffect(() => {
    // Find the team member data based on memberId
    const member = mockTeamMembers.find(m => m.id === parseInt(memberId));
    if (member) {
      setFormData({
        name: member.name,
        role: member.role,
        image: null,
        imagePreview: member.image
      });
    }
  }, [memberId]);

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
    console.log('Saving team member changes:', formData);
    // Add save logic here
    alert('Team member updated successfully!');
    // Navigate back to edit our team
    window.location.href = '/dashboard/edit-our-team';
  };

  const handleCancel = () => {
    console.log('Canceling team member changes');
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
          <div className="edit-team-member-breadcrumb">
            Content Management / Our Team Section / Edit Team Member {memberId}
          </div>

          {/* Page Title and Back Button */}
          <div className="edit-team-member-page-header">
            <h1 className="user-main-title">Edit Team Member {memberId}</h1>
            <button 
              className="edit-team-member-back-btn"
              onClick={handleBack}
            >
              Back
            </button>
          </div>

          {/* Form */}
          <div className="edit-team-member-form">
            <div className="edit-team-member-form-group">
              <label htmlFor="name" className="edit-team-member-form-label">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="edit-team-member-form-input"
                placeholder="Enter full name"
              />
            </div>

            <div className="edit-team-member-form-group">
              <label htmlFor="role" className="edit-team-member-form-label">Role/Position</label>
              <input
                type="text"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="edit-team-member-form-input"
                placeholder="Enter role or position"
              />
            </div>

            <div className="edit-team-member-form-group">
              <label htmlFor="image" className="edit-team-member-form-label">Profile Image</label>
              <div className="edit-team-member-image-upload-section">
                {formData.imagePreview && (
                  <div className="edit-team-member-image-preview">
                    <img
                      src={formData.imagePreview}
                      alt="Profile preview"
                      className="edit-team-member-preview-image"
                    />
                  </div>
                )}
                <input
                  type="file"
                  id="image"
                  name="image"
                  onChange={handleImageUpload}
                  className="edit-team-member-file-input"
                  accept="image/*"
                />
                <label htmlFor="image" className="edit-team-member-upload-btn">
                  {formData.imagePreview ? 'Change Image' : 'Upload Profile Image'}
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="edit-team-member-action-buttons">
              <button
                type="button"
                className="edit-team-member-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="edit-team-member-save-btn"
                onClick={handleSaveTeamMember}
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

export default EditTeamMember;
