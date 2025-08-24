import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Header from '../sharedpages/header';
import Navbar from '../sharedpages/navbar';
import Footer from '../sharedpages/footer';
import './PropertyListing.css';

const PropertyListing = () => {
  const [activeTab, setActiveTab] = useState('property-listing');
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  const [amenities, setAmenities] = useState([]);
  const [isLoadingAmenities, setIsLoadingAmenities] = useState(false);
  const [amenitiesError, setAmenitiesError] = useState('');
  const [selectedAmenityTypes, setSelectedAmenityTypes] = useState([]);
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Map and amenities refs
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const placesServiceRef = useRef(null);

  // Mock property data - in real app, this would come from API
  const mockProperties = {
    '1': {
      id: '1',
      title: 'Industrial Building',
      address: '789 Maple Avenue, Singapore',
      price: 'S$ 1,200,000',
      propertyType: 'Industrial',
      size: '10,000 sq ft',
      floors: '2',
      yearBuilt: '2005',
      zoning: 'Industrial',
      parkingSpaces: '50',
      amenities: ['HVAC', 'Security System', 'Loading Docks', 'High Ceilings', 'Renovated'],
      description: 'This industrial building offers a versatile space suitable for various business operations. It features high ceilings, ample natural light, and a flexible layout that can be customized to meet specific needs. The property includes loading docks, ample parking, and is conveniently located near major transportation routes, ensuring easy access for employees and clients. Additional amenities include a secure perimeter, 24/7 access, and on-site management.',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop',
      agent: {
        name: 'Emily Tan',
        title: 'Licensed Real Estate Agent',
        image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        phone: '+65 9123 4567'
      },
      location: {
        lat: 1.3521,
        lng: 103.8198,
        address: '789 Maple Avenue, Singapore'
      }
    },
         '2': {
       id: '2',
       title: 'Commercial Warehouse',
       address: '456 Tuas South Ave 2, Singapore',
       price: 'S$ 2,500,000',
       propertyType: 'Warehouse',
       size: '15,000 sq ft',
       floors: '2',
       yearBuilt: '2010',
       zoning: 'Industrial',
       parkingSpaces: '75',
       amenities: ['High Ceilings', 'Loading Bays', 'Office Space', 'Security System', 'HVAC'],
       description: 'This modern commercial warehouse offers excellent logistics capabilities with high ceilings and multiple loading bays. The property includes office space, security systems, and is strategically located near major transportation hubs. Perfect for distribution centers, manufacturing, or storage operations.',
       image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop',
       agent: {
         name: 'David Chen',
         title: 'Senior Property Consultant',
         image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
         phone: '+65 9234 5678'
       },
       location: {
         lat: 1.2981,
         lng: 103.6476,
         address: '456 Tuas South Ave 2, Singapore'
       }
     },
     '3': {
       id: '3',
       title: 'Office Complex',
       address: '321 Changi Business Park, Singapore',
       price: 'S$ 3,800,000',
       propertyType: 'Office',
       size: '8,000 sq ft',
       floors: '3',
       yearBuilt: '2015',
       zoning: 'Commercial',
       parkingSpaces: '100',
       amenities: ['Modern Facilities', 'Parking', 'Security', 'Conference Rooms', 'Cafeteria'],
       description: 'This premium office complex offers modern facilities and amenities perfect for corporate headquarters or professional services. Features include conference rooms, cafeteria, and ample parking. Located in the prestigious Changi Business Park with easy access to Changi Airport and major transportation routes.',
       image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
       agent: {
         name: 'Sarah Lim',
         title: 'Commercial Property Specialist',
         image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
         phone: '+65 9345 6789'
       },
       location: {
         lat: 1.3371,
         lng: 103.9614,
         address: '321 Changi Business Park, Singapore'
       }
     },
     '4': {
       id: '4',
       title: 'Factory Building',
       address: '654 Pasir Panjang Terminal, Singapore',
       price: 'S$ 4,500,000',
       propertyType: 'Factory',
       size: '20,000 sq ft',
       floors: '2',
       yearBuilt: '2008',
       zoning: 'Industrial',
       parkingSpaces: '80',
       amenities: ['Heavy Machinery', 'Storage', 'Transport Access', 'Loading Docks', 'Security'],
       description: 'This large factory building is designed for heavy manufacturing operations with reinforced floors, high ceilings, and multiple loading docks. The property includes storage areas and is strategically located near Pasir Panjang Terminal for easy access to shipping and logistics.',
       image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop',
       agent: {
         name: 'Michael Wong',
         title: 'Industrial Property Expert',
         image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
         phone: '+65 9456 7890'
       },
       location: {
         lat: 1.2721,
         lng: 103.7918,
         address: '654 Pasir Panjang Terminal, Singapore'
       }
     }
  };

  const mockProperty = mockProperties[id] || mockProperties['1'];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProperty(mockProperty);
      setLoading(false);
    }, 500);
  }, [id]);

  // Initialize map when property is loaded
  useEffect(() => {
    if (property && window.google) {
      initializeMap();
    }
  }, [property]);

  // Refetch amenities when selected types change
  useEffect(() => {
    if (property && window.google && placesServiceRef.current) {
      fetchAmenities({ lat: property.location.lat, lng: property.location.lng });
    }
  }, [selectedAmenityTypes]);

  // Initialize Google Map
  const initializeMap = () => {
    if (!window.google || !property) return;

    const mapElement = document.getElementById('property-listing-map');
    if (!mapElement) return;

    const center = { lat: property.location.lat, lng: property.location.lng };

    const map = new window.google.maps.Map(mapElement, {
      center: center,
      zoom: 16,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    mapInstanceRef.current = map;

    // Add marker for the property
    const marker = new window.google.maps.Marker({
      position: center,
      map: map,
      title: property.title,
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new window.google.maps.Size(32, 32)
      }
    });

    markerRef.current = marker;

    // Initialize Places service for amenities
    const placesService = new window.google.maps.places.PlacesService(map);
    placesServiceRef.current = placesService;

    // Load amenities for the property location
    fetchAmenities(center);
  };

  // Fetch nearby amenities
  const fetchAmenities = async (location) => {
    if (!window.google || !placesServiceRef.current) {
      setAmenitiesError('Google Maps not loaded');
      return;
    }

    if (!location) {
      setAmenities([]);
      return;
    }

    setIsLoadingAmenities(true);
    setAmenitiesError('');

    try {
      const requests = selectedAmenityTypes.map(type => ({
        location: location,
        radius: 1000,
        type: type
      }));

      const results = await Promise.all(
        requests.map(request =>
          new Promise((resolve, reject) => {
            placesServiceRef.current.nearbySearch(request, (results, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                resolve(results || []);
              } else {
                resolve([]);
              }
            });
          })
        )
      );

      const allAmenities = results.flat().sort((a, b) => {
        const distanceA = window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(location),
          a.geometry.location
        );
        const distanceB = window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(location),
          b.geometry.location
        );
        return distanceA - distanceB;
      });

      // Remove duplicates and enrich with distance
      const uniqueAmenities = allAmenities.filter((amenity, index, self) =>
        index === self.findIndex(a => a.place_id === amenity.place_id)
      ).map(amenity => ({
        ...amenity,
        distance: window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(location),
          amenity.geometry.location
        )
      }));

      setAmenities(uniqueAmenities.slice(0, 20)); // Limit to 20 amenities
    } catch (error) {
      console.error('Error fetching amenities:', error);
      setAmenitiesError('Failed to load amenities');
    } finally {
      setIsLoadingAmenities(false);
    }
  };



  // Handle amenity type toggle
  const handleToggleAmenity = (type) => {
    setSelectedAmenityTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Amenity options - same as prediction.js
  const amenityOptions = [
    { type: 'school', label: 'Schools' },
    { type: 'hospital', label: 'Hospitals' },
    { type: 'supermarket', label: 'Supermarkets' },
    { type: 'restaurant', label: 'Restaurants' },
    { type: 'cafe', label: 'Cafes' },
    { type: 'bank', label: 'Banks' },
    { type: 'atm', label: 'ATMs' },
    { type: 'shopping_mall', label: 'Shopping Malls' },
    { type: 'bus_station', label: 'Bus Stations' },
    { type: 'subway_station', label: 'MRT' },
    { type: 'gym', label: 'Gyms' },
    { type: 'pharmacy', label: 'Pharmacies' }
  ];

  const handleContactAgent = () => {
    const message = `Hi ${property.agent.name}, I'm interested in the property at ${property.address}`;
    const whatsappUrl = `https://wa.me/${property.agent.phone.replace(/\s/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleBackToListings = () => {
    navigate('/dashboard/property-listings');
  };

  if (loading) {
    return (
      <div className="property-listing-loading">
        <div className="property-listing-loading-spinner"></div>
        <p>Loading property details...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <Header />
      
      <div className="user-dashboard-container">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="user-main-content">
          {/* Breadcrumbs */}
          <div className="property-listing-breadcrumbs">
            <button onClick={handleBackToListings} className="property-listing-back-button">
              Property Listings
            </button>
            <span className="property-listing-breadcrumb-separator">/</span>
            <span className="property-listing-breadcrumb-current">{property.address}</span>
          </div>

          {/* Property Header */}
          <div className="user-content-header">
            <h1 className="user-main-title">{property.title}</h1>
            <p className="property-listing-address">{property.address}</p>
            <div className="property-listing-price">{property.price}</div>
          </div>

          {/* Property Image */}
          <div className="property-listing-image-section">
            <img 
              src={property.image} 
              alt={property.title}
              className="property-listing-main-image"
            />
          </div>

          {/* Property Details Grid */}
          <div className="property-listing-details-grid">
            <div className="property-listing-summary-card">
              <h2 className="property-listing-section-title">Property Summary</h2>
              <div className="property-listing-summary-list">
                <div className="property-listing-summary-item">
                  <span className="property-listing-summary-label">Property Type:</span>
                  <span className="property-listing-summary-value">{property.propertyType}</span>
                </div>
                <div className="property-listing-summary-item">
                  <span className="property-listing-summary-label">Size:</span>
                  <span className="property-listing-summary-value">{property.size}</span>
                </div>
                <div className="property-listing-summary-item">
                  <span className="property-listing-summary-label">Number of Floors:</span>
                  <span className="property-listing-summary-value">{property.floors}</span>
                </div>
                <div className="property-listing-summary-item">
                  <span className="property-listing-summary-label">Year Built:</span>
                  <span className="property-listing-summary-value">{property.yearBuilt}</span>
                </div>
                <div className="property-listing-summary-item">
                  <span className="property-listing-summary-label">Zoning:</span>
                  <span className="property-listing-summary-value">{property.zoning}</span>
                </div>
                <div className="property-listing-summary-item">
                  <span className="property-listing-summary-label">Parking Spaces:</span>
                  <span className="property-listing-summary-value">{property.parkingSpaces}</span>
                </div>
              </div>
              
              {/* Amenities Section */}
              <div className="property-listing-amenities-section">
                <h3 className="property-listing-amenities-subtitle">Amenities</h3>
                <div className="property-listing-amenities-grid">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="property-listing-amenity-block">
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="property-listing-description">
            <h2 className="property-listing-section-title">Description</h2>
            <p className="property-listing-description-text">{property.description}</p>
          </div>

          {/* Location & Map */}
          <div className="property-listing-location">
            <h2 className="property-listing-section-title">Location & Amenities</h2>
            <div className="property-listing-map-container">
              <div id="property-listing-map" className="property-listing-map-container-inner"></div>
              
              {/* Nearby Amenities Panel */}
              <div className="property-listing-amenities-panel">
                <div className="property-listing-amenities-header">
                  <h3>Nearby Amenities</h3>
                  <div className="property-listing-amenity-filters">
                    {amenityOptions.map((opt) => (
                      <button 
                        key={opt.type}
                        type="button" 
                        className={`property-listing-amenity-chip ${selectedAmenityTypes.includes(opt.type) ? 'property-listing-active' : ''}`}
                        onClick={() => handleToggleAmenity(opt.type)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {isLoadingAmenities && (
                  <div className="property-listing-amenities-loading">Loading amenities…</div>
                )}
                {amenitiesError && (
                  <div className="property-listing-amenities-error">{amenitiesError}</div>
                )}

                {!isLoadingAmenities && !amenitiesError && amenities.length === 0 && (
                  <div className="property-listing-amenities-empty">No amenities found for the selected filters.</div>
                )}

                {!isLoadingAmenities && amenities.length > 0 && (
                  <ul className="property-listing-amenities-list">
                    {amenities.map((a) => (
                      <li className="property-listing-amenity-item" key={a.place_id}>
                        <div className="property-listing-amenity-main">
                          <div className="property-listing-amenity-name">{a.name}</div>
                          {a.vicinity && <div className="property-listing-amenity-address">{a.vicinity}</div>}
                        </div>
                        <div className="property-listing-amenity-meta">
                          {typeof a.rating === 'number' && (
                            <span className="property-listing-amenity-rating">★ {a.rating.toFixed(1)}</span>
                          )}
                          {typeof a.distance === 'number' && (
                            <span className="property-listing-amenity-distance">{Math.round(a.distance)} m</span>
                          )}
                          <a
                            className="property-listing-amenity-link"
                            href={`https://www.google.com/maps/place/?q=place_id:${a.place_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open in Maps
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Contact Agent */}
          <div className="property-listing-contact-agent-section">
            <h2 className="property-listing-section-title">Contact Agent</h2>
            <div className="property-listing-agent-card">
              <div className="property-listing-agent-info">
                <img 
                  src={property.agent.image} 
                  alt={property.agent.name}
                  className="property-listing-agent-image"
                />
                <div className="property-listing-agent-details">
                  <h3 className="property-listing-agent-name">{property.agent.name}</h3>
                  <p className="property-listing-agent-title">{property.agent.title}</p>
                </div>
              </div>
              <button 
                onClick={handleContactAgent}
                className="property-listing-contact-agent-btn"
              >
                <span className="property-listing-whatsapp-icon">📱</span>
                Contact Agent via WhatsApp
              </button>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default PropertyListing;
