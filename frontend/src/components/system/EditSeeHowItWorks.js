import React, { useState } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './EditSeeHowItWorks.css';

const EditSeeHowItWorks = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [selectedModule, setSelectedModule] = useState(1);
  const [modules, setModules] = useState([
    {
      id: 1,
      title: 'Module 1',
      address: '123 Maple Street',
      level: '2',
      unitArea: '1500',
      image: '/module1-image.jpg'
    },
    {
      id: 2,
      title: 'Module 2',
      address: '456 Cedar Avenue',
      level: '1',
      unitArea: '2000',
      image: '/module2-image.jpg'
    },
    {
      id: 3,
      title: 'Module 3',
      address: '789 Birch Lane',
      level: '3',
      unitArea: '1800',
      image: '/module3-image.jpg'
    },
    {
      id: 4,
      title: 'Module 4',
      address: 'Not Available',
      level: 'Not Available',
      unitArea: 'Not Available',
      image: '/module4-image.jpg'
    }
  ]);

  const [moduleDetails, setModuleDetails] = useState({
    address: modules[0].address,
    level: modules[0].level,
    unitArea: modules[0].unitArea
  });

  const handleModuleSelect = (moduleId) => {
    setSelectedModule(moduleId);
    const selectedModuleData = modules.find(module => module.id === moduleId);
    setModuleDetails({
      address: selectedModuleData.address,
      level: selectedModuleData.level,
      unitArea: selectedModuleData.unitArea
    });
  };

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setModuleDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = () => {
    console.log('Saving see how it works section changes:', { selectedModule, moduleDetails });
    // Add save logic here
    alert('See How It Works section updated successfully!');
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
          <div className="edit-see-how-it-works-breadcrumb">
            Content Management / Edit See How It Works
          </div>

          {/* Page Title and Back Button */}
          <div className="edit-see-how-it-works-page-header">
            <h1 className="user-main-title">Edit See How It Works</h1>
            <button 
              className="edit-see-how-it-works-back-btn"
              onClick={handleBack}
            >
              Back
            </button>
          </div>

          {/* Property Modules Section */}
          <div className="edit-see-how-it-works-modules-section">
            <h2 className="edit-see-how-it-works-modules-heading">Property Modules</h2>
            
            <div className="edit-see-how-it-works-modules-grid">
              {modules.map((module) => (
                <div 
                  key={module.id} 
                  className={`edit-see-how-it-works-module-card ${selectedModule === module.id ? 'selected' : ''}`}
                  onClick={() => handleModuleSelect(module.id)}
                >
                  <div className="edit-see-how-it-works-module-image">
                    <img
                      src={module.image}
                      alt={module.title}
                      className="edit-see-how-it-works-module-thumbnail"
                    />
                  </div>
                  <div className="edit-see-how-it-works-module-content">
                    <h3 className="edit-see-how-it-works-module-title">{module.title}</h3>
                    <p className="edit-see-how-it-works-module-details">
                      Key Address: {module.address}, Level: {module.level}, Unit Area: {module.unitArea} sq ft
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Module Details Section */}
          <div className="edit-see-how-it-works-module-details-section">
            <h2 className="edit-see-how-it-works-details-heading">Module {selectedModule} Details</h2>
            
            <div className="edit-see-how-it-works-details-form">
              <div className="edit-see-how-it-works-form-group">
                <label htmlFor="address" className="edit-see-how-it-works-form-label">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={moduleDetails.address}
                  onChange={handleDetailChange}
                  className="edit-see-how-it-works-form-input"
                  placeholder="Enter address"
                />
              </div>

              <div className="edit-see-how-it-works-form-group">
                <label htmlFor="level" className="edit-see-how-it-works-form-label">Level</label>
                <input
                  type="text"
                  id="level"
                  name="level"
                  value={moduleDetails.level}
                  onChange={handleDetailChange}
                  className="edit-see-how-it-works-form-input"
                  placeholder="Enter level"
                />
              </div>

              <div className="edit-see-how-it-works-form-group">
                <label htmlFor="unitArea" className="edit-see-how-it-works-form-label">Unit Area (sq ft)</label>
                <input
                  type="text"
                  id="unitArea"
                  name="unitArea"
                  value={moduleDetails.unitArea}
                  onChange={handleDetailChange}
                  className="edit-see-how-it-works-form-input"
                  placeholder="Enter unit area"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="edit-see-how-it-works-action-buttons">
            <button
              type="button"
              className="edit-see-how-it-works-cancel-btn"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="edit-see-how-it-works-save-btn"
              onClick={handleSaveChanges}
            >
              Save Changes
            </button>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default EditSeeHowItWorks;
