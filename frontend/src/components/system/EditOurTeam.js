import React, { useState, useEffect } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './EditOurTeam.css';
import api from '../../services/api';

const EditOurTeam = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionSubtitle, setSectionSubtitle] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch team data from API
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        
        // Fetch both section details and team members in parallel
        const [sectionResponse, membersResponse] = await Promise.all([
          api.team.getSection(),
          api.team.getMembers()
        ]);
        
        if (sectionResponse.success) {
          setSectionTitle(sectionResponse.section_title);
          setSectionSubtitle(sectionResponse.section_subtitle);
        }
        
        if (membersResponse.success) {
          setTeamMembers(membersResponse.members);
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
        setMessage('Error loading team data');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, []);

  const handleSectionTitleChange = (e) => {
    setSectionTitle(e.target.value);
  };

  const handleSectionSubtitleChange = (e) => {
    setSectionSubtitle(e.target.value);
  };

  const handleTeamMemberEdit = (memberId) => {
    // Navigate to edit team member page
    window.location.href = `/dashboard/edit-team-member/${memberId}`;
  };

  const handleTeamMemberDelete = async (memberId) => {
    const confirmed = window.confirm('Are you sure you want to delete this team member? This action cannot be undone.');
    
    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      const response = await api.team.deleteMember(memberId);
      
      if (response.success) {
        // Remove member from local state
        setTeamMembers(prev => prev.filter(member => member.id !== memberId));
        setMessage('Team member deleted successfully');
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error deleting team member');
      }
    } catch (error) {
      console.error('Error deleting team member:', error);
      setMessage('Error deleting team member');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTeamMember = () => {
    // Navigate to add team member page
    window.location.href = '/dashboard/add-team-member';
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      
      // Save section details
      const sectionResponse = await api.team.updateSection({
        section_title: sectionTitle,
        section_subtitle: sectionSubtitle
      });
      
      if (sectionResponse.success) {
        setMessage('Our Team section updated successfully!');
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error updating section details');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      setMessage('Error saving changes');
    } finally {
      setSaving(false);
    }
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
          <div className="edit-our-team-breadcrumb">
            Content Management / Our Team Section
          </div>

          {/* Page Title and Back Button */}
          <div className="edit-our-team-page-header">
            <h1 className="user-main-title">Our Team Section</h1>
            <button 
              className="edit-our-team-back-btn"
              onClick={handleBack}
            >
              Back
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`edit-our-team-message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="edit-our-team-loading">
              Loading team data...
            </div>
          )}

          {/* Form */}
          <div className="edit-our-team-form">
            {/* Section Title */}
            <div className="edit-our-team-form-group">
              <label htmlFor="sectionTitle" className="edit-our-team-form-label">Section Title</label>
              <input
                type="text"
                id="sectionTitle"
                value={sectionTitle}
                onChange={handleSectionTitleChange}
                className="edit-our-team-form-input"
                placeholder="Enter section title"
              />
            </div>

            {/* Section Subtitle */}
            <div className="edit-our-team-form-group">
              <label htmlFor="sectionSubtitle" className="edit-our-team-form-label">Section Subtitle</label>
              <input
                type="text"
                id="sectionSubtitle"
                value={sectionSubtitle}
                onChange={handleSectionSubtitleChange}
                className="edit-our-team-form-input"
                placeholder="Enter section subtitle"
              />
            </div>

            {/* Team Members Section */}
            <div className="edit-our-team-members-section">
              <h2 className="edit-our-team-members-heading">Team Members</h2>
              
              <div className="edit-our-team-members-list">
                {teamMembers.map((member) => (
                  <div key={member.id} className="edit-our-team-member-card">
                    <div className="edit-our-team-member-image">
                      {member.image_url ? (
                        <img
                          src={member.image_url}
                          alt={member.name}
                          className="edit-our-team-member-profile"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <div className="edit-our-team-member-placeholder" style={{ display: member.image_url ? 'none' : 'block' }}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="edit-our-team-member-content">
                      <h3 className="edit-our-team-member-name">{member.name}</h3>
                      <p className="edit-our-team-member-role">{member.role}</p>
                      {member.description && (
                        <p className="edit-our-team-member-description">{member.description}</p>
                      )}
                    </div>
                    <div className="edit-our-team-member-actions">
                      <button 
                        className="edit-our-team-edit-member-btn"
                        onClick={() => handleTeamMemberEdit(member.id)}
                        title="Edit Team Member"
                      >
                        ✏️
                      </button>
                      <button 
                        className="edit-our-team-delete-member-btn"
                        onClick={() => handleTeamMemberDelete(member.id)}
                        title="Delete Team Member"
                        disabled={saving}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                className="edit-our-team-add-team-member-btn"
                onClick={handleAddTeamMember}
              >
                Add Team Member
              </button>
            </div>

            {/* Action Buttons */}
            <div className="edit-our-team-action-buttons">
              <button
                type="button"
                className="edit-our-team-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="edit-our-team-save-btn"
                onClick={handleSaveChanges}
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

export default EditOurTeam;
