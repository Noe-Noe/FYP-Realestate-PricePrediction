import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../context/ApiContext';
import { authAPI } from '../../services/api';

import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './bookmarks.css';





const Bookmarks = () => {
  const [activeTab, setActiveTab] = useState('bookmarks');
  const navigate = useNavigate();
  const { getUserName } = useApi();

  // State for bookmarks from database
  const [bookmarkedAddresses, setBookmarkedAddresses] = useState([]);
  const [bookmarkedPredictions, setBookmarkedPredictions] = useState([]);
  const [bookmarkedComparisons, setBookmarkedComparisons] = useState([]);
  
  // Loading and error states
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(true);
  const [bookmarksError, setBookmarksError] = useState('');


  // Get user type from localStorage
  const userType = localStorage.getItem('userType') || 'free';
  const isPremiumUser = userType === 'premium';

  // Load bookmarks from database
  const loadBookmarks = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('No access token found, skipping bookmarks load');
        setBookmarkedAddresses([]);
        setBookmarkedPredictions([]);
        setBookmarkedComparisons([]);
        setIsLoadingBookmarks(false);
        return;
      }

      setIsLoadingBookmarks(true);
      setBookmarksError('');
      
      const response = await authAPI.getBookmarks();
      console.log('Loaded bookmarks:', response);
      
      // The API returns a structured object with separate arrays
      const addresses = response.bookmarked_addresses || [];
      const predictions = response.bookmarked_predictions || [];
      const comparisons = response.bookmarked_comparisons || [];
      
      console.log('Extracted addresses:', addresses);
      console.log('Extracted predictions:', predictions);
      console.log('Extracted comparisons:', comparisons);
      
      setBookmarkedAddresses(addresses);
      setBookmarkedPredictions(predictions);
      setBookmarkedComparisons(comparisons);
      
      } catch (error) {
      console.error('Error loading bookmarks:', error);
      setBookmarksError(error.message || 'Failed to load bookmarks');
      // Set empty arrays if API fails
      setBookmarkedAddresses([]);
      setBookmarkedPredictions([]);
      setBookmarkedComparisons([]);
    } finally {
      setIsLoadingBookmarks(false);
    }
  };





  // Load bookmarks on component mount
  useEffect(() => {
    loadBookmarks();
  }, []);



  // Handler functions for view buttons
  const handleBookmarkedAddressView = (address) => {
    console.log('Address bookmark clicked:', address);
    // Navigate to price prediction with the full bookmark data
    navigate('/dashboard/priceprediction', { 
      state: { 
        prefillAddress: address.address,
        prefillPropertyType: address.property_type,
        prefillFloorArea: address.floor_area ? address.floor_area.toString() : '',
        prefillLevel: address.level || '',
        prefillUnit: address.unit_number || '',
        fromBookmark: true 
      } 
    });
  };



  const handlePredictionClick = (prediction) => {
    console.log('Prediction bookmark clicked:', prediction);
    // Navigate directly to prediction results page with actual bookmark data
    navigate('/dashboard/prediction', { 
      state: { 
        searchData: {
          address: prediction.address,
          propertyType: prediction.property_type,
          floorArea: prediction.floor_area ? prediction.floor_area.toString() : '',
          level: prediction.level || '',
          unit: prediction.unit_number || ''
        },
        fromBookmark: true 
      } 
    });
  };

  const handleComparisonClick = (comparison) => {
    console.log('Comparison bookmark clicked:', comparison);
    // Navigate directly to comparison results page with actual bookmark data
    navigate('/dashboard/comparison', { 
      state: { 
        properties: [
          {
            id: Date.now(),
            propertyType: comparison.property_type || '',
            address: comparison.address,
            floorArea: comparison.floor_area ? comparison.floor_area.toString() : '',
            level: comparison.level || '',
            unit: comparison.unit_number || ''
          },
          {
            id: Date.now() + 1,
            propertyType: comparison.property_type_2 || '',
            address: comparison.address_2,
            floorArea: comparison.floor_area_2 ? comparison.floor_area_2.toString() : '',
            level: comparison.level_2 || '',
            unit: comparison.unit_number_2 || ''
          }
        ],
        fromBookmark: true 
      } 
    });
  };

  // Remove bookmark function
  const handleRemoveBookmark = async (bookmarkType, bookmarkId) => {
    const confirmed = window.confirm('Are you sure you want to remove this bookmark?');
    if (confirmed) {
      try {
        await authAPI.deleteBookmark(bookmarkId);
        // Reload bookmarks after deletion
        loadBookmarks();
      } catch (error) {
        console.error('Error removing bookmark:', error);
        alert('Failed to remove bookmark. Please try again.');
      }
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Simple default images for bookmarks
  const getDefaultImage = (type = 'property') => {
    const images = {
      property: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=250&fit=crop&q=80',
      industrial: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=250&fit=crop&q=80',
      office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=250&fit=crop&q=80',
      retail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop&q=80',
      comparison: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop&q=80'
    };
    return images[type] || images.property;
  };



  return (
    <div className="bookmarks-dashboard">
      {/* Top Header */}
      <Header />

      <div className="bookmarks-dashboard-container">
        {/* Left Sidebar */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content */}
        <main className="bookmarks-main-content">
          <div className="bookmarks-content-header">
            <h1 className="bookmarks-main-title">My Bookmarks</h1>
            <p className="bookmarks-welcome-message">Welcome back, {getUserName()}</p>
          </div>

          {/* Error Message */}
          {bookmarksError && (
            <div className="bookmarks-error-message">
              {bookmarksError}
              <button 
                className="bookmarks-clear-error-btn"
                onClick={() => setBookmarksError('')}
              >
                ×
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoadingBookmarks && (
            <div className="bookmarks-loading">
              <p>Loading your bookmarks...</p>
            </div>
          )}

          {/* Bookmarked Addresses */}
          {!isLoadingBookmarks && !bookmarksError && (
          <section className="bookmarked-addresses">
            <h2 className="bookmarks-section-title">Bookmarked Addresses</h2>
              {bookmarkedAddresses.length > 0 ? (
            <div className="bookmarks-grid">
              {bookmarkedAddresses.map((address) => (
                <div 
                  key={address.id} 
                  className="bookmark-card address-card clickable"
                      onClick={() => handleBookmarkedAddressView(address)}
                      title="Click to get price prediction"
                    >
                      <div className="card-image">
                        <img 
                          src={getDefaultImage(address.property_type?.toLowerCase() || 'property')} 
                          alt={address.address} 
                        />
                    <button 
                      className="remove-bookmark-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveBookmark('address', address.id);
                      }}
                      title="Remove bookmark"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="card-content">
                    <h3 className="card-address">{address.address}</h3>
                      <p className="card-date">Bookmarked on {formatDate(address.created_at)}</p>
                    <p className="card-hint">💡 Click to get price prediction</p>
                  </div>
                </div>
              ))}
            </div>
              ) : (
                <div className="bookmarks-no-data">
                  <p>No bookmarked addresses yet</p>
                  <p className="bookmarks-hint">Start bookmarking properties to see them here!</p>
                </div>
              )}
          </section>
          )}

          {/* Bookmarked Predictions */}
          {!isLoadingBookmarks && !bookmarksError && (
          <section className="bookmarked-predictions">
            <h2 className="bookmarks-section-title">Bookmarked Predictions</h2>
              {bookmarkedPredictions.length > 0 ? (
            <div className="bookmarks-grid">
              {bookmarkedPredictions.map((prediction) => (
                <div 
                  key={prediction.id} 
                  className="bookmark-card prediction-card clickable"
                  onClick={() => handlePredictionClick(prediction)}
                  title="Click to view prediction details"
                >
                  <div className="card-image">
                    <img 
                      src={getDefaultImage(prediction.property_type?.toLowerCase() || 'property')} 
                      alt={prediction.address} 
                    />
                    <button 
                      className="remove-bookmark-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveBookmark('prediction', prediction.id);
                      }}
                      title="Remove bookmark"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="card-content">
                    <h3 className="card-address">{prediction.address}</h3>
                      <p className="card-date">Bookmarked on {formatDate(prediction.created_at)}</p>
                    <p className="card-hint">💡 Click to view prediction details</p>
                  </div>
                </div>
              ))}
            </div>
              ) : (
                <div className="bookmarks-no-data">
                  <p>No bookmarked predictions yet</p>
                  <p className="bookmarks-hint">Start bookmarking price predictions to see them here!</p>
                </div>
              )}
          </section>
          )}

          {/* Bookmarked Comparisons - Premium Users Only */}
          {!isLoadingBookmarks && !bookmarksError && isPremiumUser && (
            <section className="bookmarked-comparisons">
              <h2 className="bookmarks-section-title">Bookmarked Comparisons</h2>
              {bookmarkedComparisons.length > 0 ? (
              <div className="bookmarks-grid">
                {bookmarkedComparisons.map((comparison) => (
                  <div 
                    key={comparison.id} 
                    className="bookmark-card comparison-card clickable"
                    onClick={() => handleComparisonClick(comparison)}
                    title="Click to view comparison results"
                  >
                    <div className="card-image">
                      <img 
                        src={getDefaultImage('comparison')} 
                        alt={comparison.title || 'Property Comparison'} 
                      />
                      <button 
                        className="remove-bookmark-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveBookmark('comparison', comparison.id);
                        }}
                        title="Remove bookmark"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="card-content">
                      <h3 className="card-title">{comparison.title || 'Property Comparison'}</h3>
                      <p className="card-addresses">
                        <strong>Property 1:</strong> {comparison.address}<br/>
                        <span className="property-details">
                          {comparison.floor_area && `${comparison.floor_area} sqft`} 
                          {comparison.level && ` • ${comparison.level}`}
                          {comparison.unit_number && ` • Unit ${comparison.unit_number}`}
                        </span><br/>
                        <strong>Property 2:</strong> {comparison.address_2 || 'Not specified'}<br/>
                        <span className="property-details">
                          {comparison.floor_area_2 && `${comparison.floor_area_2} sqft`} 
                          {comparison.level_2 && ` • Unit ${comparison.level_2}`}
                          {comparison.unit_number_2 && ` • Unit ${comparison.unit_number_2}`}
                        </span>
                      </p>
                      <p className="card-date">Bookmarked on {formatDate(comparison.created_at)}</p>
                      <p className="card-hint">💡 Click to view comparison results</p>
                    </div>
                  </div>
                ))}
              </div>
              ) : (
                <div className="bookmarks-no-data">
                  <p>No bookmarked comparisons yet</p>
                  <p className="bookmarks-hint">Start bookmarking property comparisons to see them here!</p>
                </div>
              )}
            </section>
          )}

          {/* No Bookmarks Message */}
          {!isLoadingBookmarks && !bookmarksError && 
           bookmarkedAddresses.length === 0 && 
           bookmarkedPredictions.length === 0 && 
           bookmarkedComparisons.length === 0 && (
            <div className="bookmarks-empty-state">
              <h2>No Bookmarks Yet</h2>
              <p>You haven't bookmarked any properties, predictions, or comparisons yet.</p>
              <p className="bookmarks-hint">Start exploring the platform and bookmark items you're interested in!</p>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Bookmarks;
