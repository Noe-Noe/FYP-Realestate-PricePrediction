import React, { useState } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './AddTeamMember.css';
import api from '../../services/api';

const AddTeamMember = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [imageSource, setImageSource] = useState('upload'); // 'upload' or 'url'
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    description: '',
    image: null,
    imageUrl: '',
    imagePreview: null,
    social_links: {}
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
        image: file,
        imageUrl: '' // Clear URL when file is selected
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

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({
      ...prev,
      imageUrl: url,
      image: null, // Clear file when URL is entered
      imagePreview: url || null // Set preview to URL if provided
    }));
  };

  const handleImageSourceChange = (source) => {
    setImageSource(source);
    // Clear both when switching
    setFormData(prev => ({
      ...prev,
      image: null,
      imageUrl: '',
      imagePreview: null
    }));
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
      
      let imageUrl = ''; // Default empty image URL
      
      // Handle image based on source type
      if (imageSource === 'upload' && formData.image) {
        // Upload file if file was selected
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
      } else if (imageSource === 'url' && formData.imageUrl.trim()) {
        // Use URL directly if URL was provided
        imageUrl = formData.imageUrl.trim();
        
        // Basic URL validation
        try {
          new URL(imageUrl);
        } catch {
          setMessage('Error: Please enter a valid URL');
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
      
      const response = await api.team.createMember(memberData);
      
      if (response.success) {
        setMessage('Team member added successfully!');
        
        // Clear message after 3 seconds and navigate back
        setTimeout(() => {
          window.location.href = '/dashboard/edit-our-team';
        }, 2000);
      } else {
        setMessage(`Error adding team member: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding team member:', error);
      setMessage(`Error adding team member: ${error.message || 'Network error'}`);
    } finally {
      setSaving(false);
    }
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

          {/* Message Display */}
          {message && (
            <div className={`add-team-member-message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

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
              <label htmlFor="description" className="add-team-member-form-label">Description</label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="add-team-member-form-input"
                placeholder="Enter team member description"
              />
            </div>

            <div className="add-team-member-form-group">
              <label className="add-team-member-form-label">Profile Image</label>
              
              {/* Image Source Selection */}
              <div className="add-team-member-image-source-selection" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', marginRight: '20px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="imageSource"
                    value="upload"
                    checked={imageSource === 'upload'}
                    onChange={() => handleImageSourceChange('upload')}
                    style={{ marginRight: '8px' }}
                  />
                  Upload File
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="imageSource"
                    value="url"
                    checked={imageSource === 'url'}
                    onChange={() => handleImageSourceChange('url')}
                    style={{ marginRight: '8px' }}
                  />
                  Image URL
                </label>
              </div>

              <div className="add-team-member-image-upload-section">
                {formData.imagePreview && (
                  <div className="add-team-member-image-preview">
                    <img
                      src={formData.imagePreview}
                      alt="Profile preview"
                      className="add-team-member-preview-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        setMessage('Error: Could not load image from URL');
                      }}
                    />
                  </div>
                )}
                
                {imageSource === 'upload' ? (
                  <>
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
                  </>
                ) : (
                  <input
                    type="url"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleImageUrlChange}
                    className="add-team-member-form-input"
                    placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                    style={{ marginTop: '10px' }}
                  />
                )}
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
                disabled={saving}
              >
                {saving ? 'Adding...' : 'Add Team Member'}
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
