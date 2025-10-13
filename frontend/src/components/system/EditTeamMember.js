import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './EditTeamMember.css';
import api from '../../services/api';

const EditTeamMember = () => {
  const { memberId } = useParams();
  const [activeTab, setActiveTab] = useState('content');
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    description: '',
    image: null,
    imagePreview: null,
    social_links: {}
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchTeamMember = async () => {
      try {
        setLoading(true);
        const response = await api.team.getMember(memberId);
        
        if (response.success) {
          const member = response.member;
          setFormData({
            name: member.name,
            role: member.role,
            description: member.description || '',
            image: null,
            imagePreview: member.image_url,
            social_links: member.social_links || {}
          });
        } else {
          setMessage('Error loading team member');
        }
      } catch (error) {
        console.error('Error fetching team member:', error);
        setMessage('Error loading team member');
      } finally {
        setLoading(false);
      }
    };

    if (memberId) {
      fetchTeamMember();
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

  const handleSaveTeamMember = async () => {
    // Basic validation
    if (!formData.name.trim()) {
      setMessage('Error: Name is required');
      return;
    }
    
    if (!formData.role.trim()) {
      setMessage('Error: Role is required');
      return;
    }

    try {
      setSaving(true);
      setMessage(''); // Clear any previous messages
      
      let imageUrl = formData.imagePreview; // Keep existing image URL
      
      // If a new image was uploaded, upload it first
      if (formData.image) {
        try {
          const uploadResponse = await api.team.uploadProfilePicture(formData.image);
          if (uploadResponse.profile_picture_url) {
            imageUrl = uploadResponse.profile_picture_url;
          }
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          setMessage('Error uploading image. Please try again.');
          return;
        }
      }
      
      const memberData = {
        name: formData.name.trim(),
        role: formData.role.trim(),
        description: formData.description.trim(),
        image_url: imageUrl,
        social_links: formData.social_links
      };
      
      const response = await api.team.updateMember(memberId, memberData);
      
      if (response.success) {
        setMessage('Team member updated successfully!');
        
        // Clear message after 3 seconds and navigate back
        setTimeout(() => {
          window.location.href = '/dashboard/edit-our-team';
        }, 2000);
      } else {
        setMessage(`Error updating team member: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving team member:', error);
      setMessage(`Error updating team member: ${error.message || 'Network error'}`);
    } finally {
      setSaving(false);
    }
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

          {/* Message Display */}
          {message && (
            <div className={`edit-team-member-message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="edit-team-member-loading">
              Loading team member...
            </div>
          )}

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
              <label htmlFor="description" className="edit-team-member-form-label">Description</label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="edit-team-member-form-input"
                placeholder="Enter team member description"
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
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
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
