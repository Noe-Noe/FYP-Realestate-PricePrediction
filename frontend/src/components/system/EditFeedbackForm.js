import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './EditFeedbackForm.css';

const EditFeedbackForm = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [feedbackTypes, setFeedbackTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    status: 'active'
  });

  useEffect(() => {
    fetchFeedbackTypes();
  }, []);

  const fetchFeedbackTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.getAllFeedbackFormTypes();
      const types = response.types || [];
      
      // If no types in database, initialize with current default types
      if (types.length === 0) {
        const defaultTypes = [
          { name: 'General Feedback', value: 'general', status: 'active' },
          { name: 'Support Request', value: 'support', status: 'active' },
          { name: 'Property Viewing Inquiry', value: 'property_viewing', status: 'active' },
          { name: 'Price Quote Request', value: 'price_quote', status: 'active' }
        ];
        
        // Create default types in database
        try {
          const createdTypes = [];
          for (let i = 0; i < defaultTypes.length; i++) {
            const typeData = {
              ...defaultTypes[i],
              display_order: i
            };
            const createResponse = await authAPI.createFeedbackFormType(typeData);
            createdTypes.push(createResponse.type);
          }
          setFeedbackTypes(createdTypes);
        } catch (createError) {
          console.error('Error initializing default types:', createError);
          // If creation fails, still show them in UI (they'll be created when admin saves)
          setFeedbackTypes(defaultTypes.map((t, i) => ({ ...t, id: i + 1, display_order: i })));
        }
      } else {
        setFeedbackTypes(types);
      }
    } catch (err) {
      console.error('Error fetching feedback types:', err);
      setError(err.message || 'Failed to fetch feedback types');
      // Fallback to default types on error
      const defaultTypes = [
        { id: 1, name: 'General Feedback', value: 'general', status: 'active' },
        { id: 2, name: 'Support Request', value: 'support', status: 'active' },
        { id: 3, name: 'Property Viewing Inquiry', value: 'property_viewing', status: 'active' },
        { id: 4, name: 'Price Quote Request', value: 'price_quote', status: 'active' }
      ];
      setFeedbackTypes(defaultTypes);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      value: '',
      status: 'active'
    });
    setEditingType(null);
    setShowAddModal(true);
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      value: type.value,
      status: type.status
    });
    setShowEditModal(true);
  };

  const handleDelete = async (typeId) => {
    if (window.confirm('Are you sure you want to delete this feedback type?')) {
      try {
        await authAPI.deleteFeedbackFormType(typeId);
        setFeedbackTypes(feedbackTypes.filter(t => t.id !== typeId));
        alert('Feedback type deleted successfully');
      } catch (err) {
        console.error('Error deleting feedback type:', err);
        alert('Failed to delete feedback type');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingType) {
        // Update existing type
        const response = await authAPI.updateFeedbackFormType(editingType.id, formData);
        setFeedbackTypes(feedbackTypes.map(t => 
          t.id === editingType.id 
            ? response.type
            : t
        ));
        alert('Feedback type updated successfully');
        setShowEditModal(false);
      } else {
        // Add new type
        const response = await authAPI.createFeedbackFormType(formData);
        setFeedbackTypes([...feedbackTypes, response.type]);
        alert('Feedback type added successfully');
        setShowAddModal(false);
      }
      setFormData({
        name: '',
        value: '',
        status: 'active'
      });
      setEditingType(null);
    } catch (err) {
      console.error('Error saving feedback type:', err);
      alert('Failed to save feedback type');
    }
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setFormData({
      name: '',
      value: '',
      status: 'active'
    });
    setEditingType(null);
  };

  const getStatusBadgeClass = (status) => {
    return status === 'active' 
      ? 'feedback-form-status-badge active' 
      : 'feedback-form-status-badge inactive';
  };

  if (loading) {
    return (
      <div className="user-dashboard">
        <Header />
        <div className="user-dashboard-container">
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="user-main-content">
            <div className="feedback-form-loading">Loading feedback form types...</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          <div className="user-content-header">
            <div>
              <nav className="feedback-form-breadcrumb">
                <span>Content Management</span>
                <span>/</span>
                <span>Feedback Form</span>
              </nav>
              <h1 className="user-main-title">Feedback Form</h1>
            </div>
          </div>

          {error && (
            <div className="feedback-form-error">
              Error: {error}
              <button onClick={fetchFeedbackTypes} className="feedback-form-retry-btn">
                Retry
              </button>
            </div>
          )}

          <div className="feedback-form-content">
            <div className="feedback-form-table-container">
              <table className="feedback-form-table">
                <thead>
                  <tr>
                    <th>Feedback Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbackTypes.length > 0 ? (
                    feedbackTypes.map((type) => (
                      <tr key={type.id}>
                        <td>{type.name}</td>
                        <td>
                          <span className={getStatusBadgeClass(type.status)}>
                            {type.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="feedback-form-actions">
                          <button 
                            className="feedback-form-edit-btn"
                            onClick={() => handleEdit(type)}
                          >
                            Edit
                          </button>
                          <span className="feedback-form-action-separator">|</span>
                          <button 
                            className="feedback-form-delete-btn"
                            onClick={() => handleDelete(type.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="feedback-form-no-data">
                        No feedback types found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="feedback-form-actions-footer">
              <button 
                className="feedback-form-add-btn"
                onClick={handleAddNew}
              >
                Add New Feedback Type
              </button>
            </div>

            <div className="feedback-form-page-actions">
              <button 
                className="feedback-form-cancel-btn"
                onClick={() => window.location.href = '/dashboard/content-management'}
              >
                Cancel
              </button>
              <button 
                className="feedback-form-save-btn"
                onClick={() => {
                  window.location.href = '/dashboard/content-management';
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </main>
      </div>
      <Footer />

      {/* Add Modal */}
      {showAddModal && (
        <div className="feedback-form-modal-overlay" onClick={handleCancel}>
          <div className="feedback-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="feedback-form-modal-header">
              <h3>Add New Feedback Type</h3>
              <button className="feedback-form-modal-close" onClick={handleCancel}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="feedback-form-modal-form">
              <div className="feedback-form-form-group">
                <label>Feedback Type Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="e.g., Bug Report"
                />
              </div>
              <div className="feedback-form-form-group">
                <label>Value (Internal)</label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                  required
                  placeholder="e.g., bug_report"
                />
              </div>
              <div className="feedback-form-form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="feedback-form-modal-actions">
                <button type="button" onClick={handleCancel} className="feedback-form-modal-cancel">
                  Cancel
                </button>
                <button type="submit" className="feedback-form-modal-submit">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="feedback-form-modal-overlay" onClick={handleCancel}>
          <div className="feedback-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="feedback-form-modal-header">
              <h3>Edit Feedback Type</h3>
              <button className="feedback-form-modal-close" onClick={handleCancel}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="feedback-form-modal-form">
              <div className="feedback-form-form-group">
                <label>Feedback Type Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="feedback-form-form-group">
                <label>Value (Internal)</label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                  required
                />
              </div>
              <div className="feedback-form-form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="feedback-form-modal-actions">
                <button type="button" onClick={handleCancel} className="feedback-form-modal-cancel">
                  Cancel
                </button>
                <button type="submit" className="feedback-form-modal-submit">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditFeedbackForm;

