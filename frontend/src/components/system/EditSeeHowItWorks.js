import React, { useState, useEffect } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './EditSeeHowItWorks.css';
import api from '../../services/api';

const EditSeeHowItWorks = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [selectedModule, setSelectedModule] = useState(1);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [moduleDetails, setModuleDetails] = useState({
    title: '',
    address: '',
    level: '',
    unitArea: '',
    propertyType: '',
    imageUrl: ''
  });

  // Fetch HowItWorks properties from API
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await api.howitworks.getProperties();
        if (response.success) {
          const transformedModules = response.properties.map(property => ({
            id: property.id,
            title: property.title,
            address: property.address,
            level: property.level,
            unitArea: property.unit_area,
            propertyType: property.property_type,
            image: property.image_url,
            isPlaceholder: false
          }));
          const limitedModules = transformedModules.slice(0, 4);

          // Pad to exactly 4 modules with placeholders if needed
          const placeholders = [];
          for (let i = limitedModules.length; i < 4; i++) {
            const slotNumber = i + 1;
            placeholders.push({
              id: `${slotNumber}`,
              title: `Module ${slotNumber} (Empty)`,
              address: '',
              level: '',
              unitArea: '',
              propertyType: '',
              image: '',
              isPlaceholder: true,
            });
          }

          const paddedModules = [...limitedModules, ...placeholders];
          setModules(paddedModules);
          
          // Set initial selected module details
          const firstReal = paddedModules.find(m => !m.isPlaceholder);
          if (firstReal) {
            setSelectedModule(firstReal.id);
            setModuleDetails({
              title: firstReal.title,
              address: firstReal.address,
              level: firstReal.level,
              unitArea: firstReal.unitArea,
              propertyType: firstReal.propertyType,
              imageUrl: firstReal.image
            });
          } else if (paddedModules.length > 0) {
            // All placeholders - select the first slot but disable saving later
            setSelectedModule(paddedModules[0].id);
            setModuleDetails({ title: '', address: '', level: '', unitArea: '', propertyType: '', imageUrl: '' });
          }
        }
      } catch (error) {
        console.error('Error fetching HowItWorks properties:', error);
        setMessage('Error loading properties');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handleModuleSelect = (moduleId) => {
    setSelectedModule(moduleId);
    const selectedModuleData = modules.find(module => module.id === moduleId);
    if (selectedModuleData) {
      setModuleDetails({
        title: selectedModuleData.title,
        address: selectedModuleData.address,
        level: selectedModuleData.level,
        unitArea: selectedModuleData.unitArea,
        propertyType: selectedModuleData.propertyType,
        imageUrl: selectedModuleData.image
      });
    }
  };

  const handleInputChange = (field, value) => {
    setModuleDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');

      const selected = modules.find(m => String(m.id) === String(selectedModule));

      const propertyData = {
        title: moduleDetails.title,
        address: moduleDetails.address,
        level: moduleDetails.level,
        unit_area: moduleDetails.unitArea,
        property_type: moduleDetails.propertyType,
        image_url: moduleDetails.imageUrl
      };

      let response;
      if (selected && selected.isPlaceholder) {
        // Create new property; property_order maps to module number if available
        const slotIndex = modules.findIndex(m => String(m.id) === String(selectedModule));
        const desiredOrder = slotIndex >= 0 ? slotIndex + 1 : undefined;
        response = await api.howitworks.createProperty({ ...propertyData, property_order: desiredOrder });
        if (response.success) {
          // Replace placeholder with new module using returned id
          const newId = response.id;
          setModules(prev => prev.map((m, idx) => {
            if (String(m.id) === String(selectedModule)) {
              return { id: newId, title: propertyData.title, address: propertyData.address, level: propertyData.level, unitArea: propertyData.unit_area, propertyType: propertyData.property_type, image: propertyData.image_url, isPlaceholder: false };
            }
            return m;
          }));
          setSelectedModule(newId);
        }
      } else if (selected) {
        response = await api.howitworks.updateProperty(selectedModule, propertyData);
      } else {
        setMessage('Please select a module to save.');
        return;
      }
      if (response && response.success) {
        setMessage('Property updated successfully!');
        // Update local modules array
        setModules(prev => prev.map(module => 
          module.id === selectedModule 
            ? { ...module, ...propertyData, unitArea: propertyData.unit_area, propertyType: propertyData.property_type, image: propertyData.image_url }
            : module
        ));
      }
    } catch (error) {
      console.error('Error updating property:', error);
      setMessage(`Error updating property: ${error.message}`);
    } finally {
      setSaving(false);
    }
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

          {/* Message Display */}
          {message && (
            <div className={`edit-see-how-message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="edit-see-how-loading">
              Loading properties...
            </div>
          )}

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
                <label htmlFor="title" className="edit-see-how-it-works-form-label">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={moduleDetails.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="edit-see-how-it-works-form-input"
                  placeholder="Enter title"
                />
              </div>

              <div className="edit-see-how-it-works-form-group">
                <label htmlFor="address" className="edit-see-how-it-works-form-label">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={moduleDetails.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
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
                  onChange={(e) => handleInputChange('level', e.target.value)}
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
                  onChange={(e) => handleInputChange('unitArea', e.target.value)}
                  className="edit-see-how-it-works-form-input"
                  placeholder="Enter unit area"
                />
              </div>

              <div className="edit-see-how-it-works-form-group">
                <label htmlFor="propertyType" className="edit-see-how-it-works-form-label">Property Type</label>
                <select
                  id="propertyType"
                  name="propertyType"
                  value={moduleDetails.propertyType}
                  onChange={(e) => handleInputChange('propertyType', e.target.value)}
                  className="edit-see-how-it-works-form-input"
                >
                  <option value="">Select Property Type</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </div>

              <div className="edit-see-how-it-works-form-group">
                <label htmlFor="imageUrl" className="edit-see-how-it-works-form-label">Image URL</label>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  value={moduleDetails.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  className="edit-see-how-it-works-form-input"
                  placeholder="Enter image URL"
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
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default EditSeeHowItWorks;
