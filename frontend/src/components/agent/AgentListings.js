import React, { useState, useEffect } from 'react';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './agent-common.css';
import './AgentListings.css';

const AgentListings = () => {
  const [activeTab, setActiveTab] = useState('listings');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [removingListingId, setRemovingListingId] = useState(null);

  // Mock data for property listings - Singapore context
  const [listingsData, setListingsData] = useState(() => {
    // Try to load from localStorage first, otherwise use default data
    const savedListings = localStorage.getItem('agentListingsData');
    if (savedListings) {
      return JSON.parse(savedListings);
    }
    
    return [
      {
        id: 1,
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=60&h=60&fit=crop',
        address: '71 Robinson Road, #14-01, Robinson 77, Singapore 068895',
        streetAddress: '71 Robinson Road, #14-01',
        city: 'Singapore',
        state: 'Singapore',
        zipCode: '068895',
        propertyType: 'Office',
        size: '15,000',
        floors: '14',
        yearBuilt: '2018',
        zoning: 'Commercial',
        parkingSpaces: '25',
        askingPrice: 'S$2,500,000',
        priceType: 'sale',
        description: 'Premium office space in the heart of Singapore\'s financial district with modern amenities and excellent accessibility.',
        status: 'Active',
        amenities: {
          hvac: true,
          securitySystem: true,
          loadingDocks: false,
          highCeilings: true,
          renovated: true
        }
      },
      {
        id: 2,
        image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=60&h=60&fit=crop',
        address: '8 Jurong Town Hall Road, #05-01, The JTC Summit, Singapore 609434',
        streetAddress: '8 Jurong Town Hall Road, #05-01',
        city: 'Singapore',
        state: 'Singapore',
        zipCode: '609434',
        propertyType: 'Industrial',
        size: '30,000',
        floors: '5',
        yearBuilt: '2015',
        zoning: 'Industrial',
        parkingSpaces: '40',
        askingPrice: 'S$1,800,000',
        priceType: 'sale',
        description: 'Large industrial space in Jurong Industrial Estate with excellent logistics connectivity and modern facilities.',
        status: 'Active',
        amenities: {
          hvac: true,
          securitySystem: true,
          loadingDocks: true,
          highCeilings: true,
          renovated: false
        }
      },
      {
        id: 3,
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=60&h=60&fit=crop',
        address: '68 Orchard Road, #B1-01, Plaza Singapura, Singapore 238839',
        streetAddress: '68 Orchard Road, #B1-01',
        city: 'Singapore',
        state: 'Singapore',
        zipCode: '238839',
        propertyType: 'Retail',
        size: '5,000',
        floors: '1',
        yearBuilt: '2000',
        zoning: 'Commercial',
        parkingSpaces: '15',
        askingPrice: 'S$1,200,000',
        priceType: 'sale',
        description: 'Prime retail space on Orchard Road with high foot traffic and excellent visibility.',
        status: 'Active',
        amenities: {
          hvac: true,
          securitySystem: true,
          loadingDocks: false,
          highCeilings: false,
          renovated: true
        }
      }
    ];
  });

  // Save listings data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('agentListingsData', JSON.stringify(listingsData));
  }, [listingsData]);

  // Refresh listings data when component mounts or when returning from edit page
  useEffect(() => {
    const refreshListings = () => {
      const savedListings = localStorage.getItem('agentListingsData');
      if (savedListings) {
        const parsedListings = JSON.parse(savedListings);
        setListingsData(parsedListings);
      }
    };

    // Refresh on mount
    refreshListings();

    // Listen for storage changes (when returning from edit page)
    const handleStorageChange = (e) => {
      if (e.key === 'agentListingsData') {
        refreshListings();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also refresh when the page becomes visible (for same-tab navigation)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshListings();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Filter listings based on search query
  const filteredListings = listingsData.filter(listing =>
    listing.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.propertyType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.askingPrice.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleEdit = (listingId) => {
    // Find the listing to edit
    const listingToEdit = listingsData.find(listing => listing.id === listingId);
    
    if (!listingToEdit) {
      alert('Listing not found!');
      return;
    }

    // Store the listing data in localStorage for the edit page to access
    localStorage.setItem('editingListingData', JSON.stringify(listingToEdit));
    
    // Navigate to the edit listing page
    window.location.href = `/dashboard/edit-listing/${listingId}`;
  };

  const handleRemove = (listingId) => {
    console.log('Remove function called with ID:', listingId);
    console.log('Current listings data:', listingsData);
    
    // Find the listing to get its address for confirmation
    const listingToRemove = listingsData.find(listing => listing.id === listingId);
    
    if (!listingToRemove) {
      alert('Listing not found!');
      return;
    }

    console.log('Found listing to remove:', listingToRemove);

    // Show confirmation dialog with listing details
    const confirmed = window.confirm(
      `Are you sure you want to remove this listing?\n\n` +
      `Address: ${listingToRemove.address}\n` +
      `Property Type: ${listingToRemove.propertyType}\n` +
      `Asking Price: ${listingToRemove.askingPrice}\n\n` +
      `This action cannot be undone.`
    );

    if (confirmed) {
      console.log('User confirmed removal');
      
      // Set loading state
      setRemovingListingId(listingId);
      
      try {
        // Simulate API call delay
        setTimeout(() => {
          console.log('Removing listing from state...');
          
          // Remove the listing from state
          setListingsData(prevListings => {
            const newListings = prevListings.filter(listing => listing.id !== listingId);
            console.log('New listings after removal:', newListings);
            return newListings;
          });
          
          // Here you would typically send the deletion request to the backend
          console.log('Removing listing:', listingId);
          
          // Show success message
          alert(`Listing removed successfully!\n\nAddress: ${listingToRemove.address}`);
          
          // Reset to first page if we're on a page that no longer exists
          const totalPages = Math.ceil((filteredListings.length - 1) / 10); // Assuming 10 items per page
          if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
          }
          
          // Clear loading state
          setRemovingListingId(null);
        }, 1000);
      } catch (error) {
        console.error('Error removing listing:', error);
        alert('Error removing listing. Please try again.');
        setRemovingListingId(null);
      }
    } else {
      console.log('User cancelled removal');
    }
  };

  const handleAddNewListing = () => {
    // Navigate to the add listing page
    window.location.href = '/dashboard/add-listing';
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'agent-listings-status active';
      case 'sold':
        return 'agent-listings-status sold';
      case 'under-contract':
        return 'agent-listings-status under-contract';
      default:
        return 'agent-listings-status';
    }
  };

  return (
    <div className="user-dashboard">
      <Header />
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="user-main-content">
          <div className="user-content-header">
            <h1 className="user-main-title">Manage Listings</h1>
          </div>
          
          <div className="agent-listings-content">
            {/* Search Bar */}
            <div className="agent-listings-search-section">
              <div className="agent-listings-search-container">
                <span className="agent-listings-search-icon">🔍</span>
                <input
                  type="text"
                  className="agent-listings-search-input"
                  placeholder="Search by address, property type, or keywords"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </div>

            {/* Listings Table */}
            <div className="agent-listings-table-container">
              <table className="agent-listings-table">
                <thead className="agent-listings-table-header">
                  <tr>
                    <th>Image</th>
                    <th>Address</th>
                    <th>Property Type</th>
                    <th>Size (sq ft)</th>
                    <th>Asking Price/Rent</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="agent-listings-table-body">
                  {filteredListings.map((listing) => (
                    <tr key={listing.id}>
                      <td>
                        <img 
                          src={listing.image} 
                          alt={listing.address}
                          className="agent-listings-property-image"
                        />
                      </td>
                      <td>
                        <div className="agent-listings-property-info">
                          <div className="agent-listings-property-address">{listing.address}</div>
                          <div className="agent-listings-property-type">{listing.propertyType}</div>
                        </div>
                      </td>
                      <td>{listing.propertyType}</td>
                      <td>{listing.size}</td>
                      <td>{listing.askingPrice}</td>
                      <td>
                        <span className={`agent-listings-status ${listing.status.toLowerCase()}`}>
                          {listing.status}
                        </span>
                      </td>
                      <td>
                        <div className="agent-listings-actions">
                          <button 
                            className="agent-listings-action-btn edit"
                            onClick={() => handleEdit(listing.id)}
                          >
                            Edit
                          </button>
                          <button 
                            className="agent-listings-action-btn remove"
                            onClick={() => {
                              console.log('Remove button clicked for listing:', listing.id);
                              handleRemove(listing.id);
                            }}
                            disabled={removingListingId === listing.id}
                          >
                            {removingListingId === listing.id ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add New Listing Button */}
            <div className="agent-listings-add-section">
              <button 
                className="agent-listings-add-btn"
                onClick={handleAddNewListing}
              >
                <span className="agent-listings-add-icon">➕</span>
                Add New Listing
              </button>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AgentListings;
