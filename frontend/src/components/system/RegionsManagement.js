import React, { useState, useEffect } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import { authAPI } from '../../services/api';
import './RegionsManagement.css';

const RegionsManagement = () => {
  const [activeTab, setActiveTab] = useState('regions');
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRegion, setEditingRegion] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [regionToDelete, setRegionToDelete] = useState(null);
  const [formData, setFormData] = useState({
    district: '',
    sector: '',
    location: ''
  });

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getAllRegions();
      setRegions(response.regions || []);
    } catch (err) {
      setError(err.message || 'Failed to load regions');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (region) => {
    setEditingRegion(region);
    setFormData({
      district: region.district,
      sector: region.sector,
      location: region.location
    });
    setShowEditModal(true);
  };

  const handleDelete = (region) => {
    setRegionToDelete(region);
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingRegion) {
        // Update existing region
        await authAPI.updateRegion(editingRegion.id, formData);
        alert('Region updated successfully!');
      } else {
        // Create new region
        await authAPI.createRegion(formData);
        alert('Region created successfully!');
      }
      setShowEditModal(false);
      setEditingRegion(null);
      setFormData({ district: '', sector: '', location: '' });
      loadRegions();
    } catch (err) {
      alert(err.message || 'Failed to save region');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await authAPI.deleteRegion(regionToDelete.id);
      alert('Region deleted successfully!');
      setShowDeleteModal(false);
      setRegionToDelete(null);
      loadRegions();
    } catch (err) {
      alert(err.message || 'Failed to delete region');
    }
  };

  const handleCancel = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setEditingRegion(null);
    setRegionToDelete(null);
    setFormData({ district: '', sector: '', location: '' });
  };

  if (loading) {
    return (
      <div className="user-dashboard">
        <Header />
        <div className="user-dashboard-container">
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="user-main-content">
            <div className="regions-loading">
              <p>Loading regions...</p>
            </div>
          </main>
        </div>
        <Footer />
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
            <h1 className="user-main-title">Manage Agent Regions</h1>
            <p className="regions-description">
              Define and manage the geographical regions that agents can be assigned to or select as their service areas.
            </p>
          </div>

          {error && (
            <div className="regions-error">
              <p>Error: {error}</p>
              <button onClick={loadRegions}>Retry</button>
            </div>
          )}

          <div className="regions-content">
            <div className="regions-table-container">
              <table className="regions-table">
                <thead>
                  <tr>
                    <th>Postal District</th>
                    <th>Postal Sector</th>
                    <th>General Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="regions-empty">
                        No regions available. Click "Add New Region" to get started.
                      </td>
                    </tr>
                  ) : (
                    regions.map((region) => (
                      <tr key={region.id}>
                        <td>{region.district}</td>
                        <td>{region.sector}</td>
                        <td>{region.location}</td>
                        <td>
                          <button
                            className="regions-edit-btn"
                            onClick={() => handleEdit(region)}
                          >
                            Edit
                          </button>
                          <span className="regions-divider">|</span>
                          <button
                            className="regions-delete-btn"
                            onClick={() => handleDelete(region)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="regions-actions">
              <button
                className="regions-add-btn"
                onClick={() => {
                  setEditingRegion(null);
                  setFormData({ district: '', sector: '', location: '' });
                  setShowEditModal(true);
                }}
              >
                Add New Region
              </button>
            </div>
          </div>
        </main>
      </div>
      <Footer />

      {/* Edit/Create Modal */}
      {showEditModal && (
        <div className="regions-modal">
          <div className="regions-modal-content">
            <h2>{editingRegion ? 'Edit Region' : 'Add New Region'}</h2>
            <div className="regions-form">
              <div className="regions-form-group">
                <label>Postal District:</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="e.g., 01, 02, 03"
                />
              </div>
              <div className="regions-form-group">
                <label>Postal Sector:</label>
                <input
                  type="text"
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  placeholder="e.g., 01, 02, 03, 04, 05, 06"
                />
              </div>
              <div className="regions-form-group">
                <label>General Location:</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Raffles Place, Cecil, Marina, People's Park"
                />
              </div>
              <div className="regions-modal-actions">
                <button className="regions-save-btn" onClick={handleSave}>
                  Save Changes
                </button>
                <button className="regions-cancel-btn" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && regionToDelete && (
        <div className="regions-modal">
          <div className="regions-modal-content">
            <h2>Delete Region</h2>
            <p>Are you sure you want to delete the region "{regionToDelete.location}"?</p>
            <div className="regions-modal-actions">
              <button className="regions-confirm-delete-btn" onClick={handleConfirmDelete}>
                Delete
              </button>
              <button className="regions-cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionsManagement;

