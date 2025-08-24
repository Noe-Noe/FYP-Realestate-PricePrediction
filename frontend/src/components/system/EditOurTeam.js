import React, { useState } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './EditOurTeam.css';

const EditOurTeam = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [sectionTitle, setSectionTitle] = useState('');
  const [teamMembers, setTeamMembers] = useState([
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
  ]);

  const handleSectionTitleChange = (e) => {
    setSectionTitle(e.target.value);
  };

  const handleTeamMemberEdit = (memberId) => {
    console.log('Edit team member:', memberId);
    // Navigate to edit team member page
    window.location.href = `/dashboard/edit-team-member/${memberId}`;
  };

  const handleTeamMemberDelete = (memberId) => {
    if (window.confirm('Are you sure you want to delete this team member?')) {
      setTeamMembers(prev => prev.filter(member => member.id !== memberId));
      console.log('Deleted team member:', memberId);
    }
  };

  const handleAddTeamMember = () => {
    // Navigate to add team member page
    window.location.href = '/dashboard/add-team-member';
  };

  const handleSaveChanges = () => {
    console.log('Saving our team section changes:', { sectionTitle, teamMembers });
    // Add save logic here
    alert('Our Team section updated successfully!');
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

            {/* Team Members Section */}
            <div className="edit-our-team-members-section">
              <h2 className="edit-our-team-members-heading">Team Members</h2>
              
              <div className="edit-our-team-members-list">
                {teamMembers.map((member) => (
                  <div key={member.id} className="edit-our-team-member-card">
                    <div className="edit-our-team-member-image">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="edit-our-team-member-profile"
                      />
                    </div>
                    <div className="edit-our-team-member-content">
                      <h3 className="edit-our-team-member-name">{member.name}</h3>
                      <p className="edit-our-team-member-role">{member.role}</p>
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

export default EditOurTeam;
