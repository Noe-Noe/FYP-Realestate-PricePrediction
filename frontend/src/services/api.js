// Resolve backend origin with environment variable fallback
export const BACKEND_ORIGIN =
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_BACKEND_ORIGIN) ||
  (typeof window !== 'undefined' && window.__BACKEND_ORIGIN__) ||
  (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost'
    ? 'http://localhost:5001'
    : '');

// If BACKEND_ORIGIN is empty (same-origin deployments), API calls will use relative paths
const API_BASE_URL = BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/api` : '/api';

// Helper function for API calls
const apiCall = async (endpoint, method = 'GET', data = null, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get JWT token from localStorage
  const token = localStorage.getItem('accessToken');
  
  const requestOptions = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      // Add Authorization header if token exists
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    // Merge with provided options (for AbortController, etc.)
    ...options,
  };
  
  // Add body for non-GET requests
  if (data && method !== 'GET') {
    requestOptions.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      let errorData = null;
      try {
        errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonError) {
        // If response is not JSON (like HTML error page), use status text
        errorMessage = response.statusText || errorMessage;
      }
      // Create error with response data attached
      const error = new Error(errorMessage);
      error.response = {
        status: response.status,
        statusText: response.statusText,
        data: errorData || { error: errorMessage }
      };
      throw error;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Auth API calls
export const authAPI = {
  // User registration
  register: async (userData) => {
    return apiCall('/auth/register', 'POST', userData);
  },

  // User login
  login: async (credentials) => {
    return apiCall('/auth/login', 'POST', credentials);
  },

  // Send OTP for email verification
  sendOTP: async (email) => {
    return apiCall('/auth/send-otp', 'POST', { email });
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    return apiCall('/auth/verify-otp', 'POST', { email, otp });
  },

  // Forgot password - send recovery OTP
  forgotPassword: async (email) => {
    return apiCall('/auth/forgot-password', 'POST', { email });
  },

  // Reset password with OTP
  resetPassword: async (email, otp, newPassword) => {
    return apiCall('/auth/reset-password', 'POST', { email, otp, new_password: newPassword });
  },

  // Get user profile
  getProfile: async () => {
    return apiCall('/auth/profile');
  },

  // Get agent profile
  getAgentProfile: async () => {
    return apiCall('/auth/agent-profile');
  },

  // Upload license picture
  uploadLicensePicture: async (formData) => {
    const url = `${API_BASE_URL}/auth/upload-license-picture`;
    const token = localStorage.getItem('accessToken');
    
    const options = {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let the browser set it with boundary
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    };

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    return apiCall('/auth/profile', 'PUT', profileData);
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    return apiCall('/auth/change-password', 'POST', { current_password: currentPassword, new_password: newPassword });
  },

  // Delete account
  deleteAccount: async () => {
    return apiCall('/auth/deactivate', 'POST');
  },

  // Deactivate own account (soft delete)
  deactivateOwnAccount: async () => {
    return apiCall('/user/deactivate', 'POST');
  },

  // Delete own account completely (hard delete)
  deleteOwnAccount: async () => {
    return apiCall('/user/delete-account', 'POST');
  },

  // Upgrade to Premium
  upgradeToPremium: async () => {
    return apiCall('/auth/upgrade-to-premium', 'POST');
  },

  // Downgrade to Free
  downgradeToFree: async () => {
    return apiCall('/auth/downgrade-to-free', 'POST');
  },

  // Get user properties and recommendations
  getUserProperties: async () => {
    return apiCall('/user/properties');
  },

  // Get review statistics (overall rating, total reviews, star distribution)
  getReviewStatistics: async () => {
    return apiCall('/reviews/statistics');
  },

  // Get published reviews for feedback page
  getPublishedReviews: async () => {
    return apiCall('/feedback/reviews');
  },

  // Submit new review (rating + review text)
  submitReview: async (reviewData) => {
    return apiCall('/review/submit', 'POST', reviewData);
  },

  // Submit new feedback/inquiry (business inquiry - feature request, bug report, etc.)
  submitFeedback: async (feedbackData) => {
    return apiCall('/feedback/submit', 'POST', feedbackData);
  },

  // Get current user's feedbacks
  getMyFeedbacks: async () => {
    return apiCall('/feedback/my-feedbacks');
  },
  
  // Get feedback form types (for user feedback form)
  getFeedbackFormTypes: async () => {
    return apiCall('/feedback/form-types');
  },

  // Get current user's reviews
  getMyReviews: async () => {
    return apiCall('/feedback/my-reviews');
  },

  // Like a review
  likeReview: async (reviewId) => {
    return apiCall('/feedback/like', 'POST', { review_id: reviewId });
  },

  // Dislike a review
  dislikeReview: async (reviewId) => {
    return apiCall('/feedback/dislike', 'POST', { review_id: reviewId });
  },

  // Get user's interaction state for reviews
  getUserInteractions: async () => {
    return apiCall('/feedback/interactions');
  },

  // Bookmark API calls
  getBookmarks: async () => {
    return apiCall('/bookmarks');
  },

  createBookmark: async (bookmarkData) => {
    // Ensure bookmarkData includes required fields with defaults
    const defaultData = {
      address: 'Address not available',
      floor_area: null,
      level: 'Ground Floor',
      unit_number: 'N/A',
      property_type: 'Property',
      address_2: null,
      floor_area_2: null,
      level_2: null,
      unit_number_2: null,
      property_type_2: null,
      ...bookmarkData
    };
    
    return apiCall('/bookmarks', 'POST', defaultData);
  },

  // Helper method to create property bookmark
  bookmarkProperty: async (propertyId, propertyData) => {
    return apiCall('/bookmarks', 'POST', {
      bookmark_type: 'property',
      reference_id: propertyId,
      address: propertyData.address,
      floor_area: propertyData.floor_area,
      level: propertyData.level,
      unit_number: propertyData.unit_number,
      property_type: propertyData.property_type
    });
  },

  // Helper method to create prediction bookmark
  bookmarkPrediction: async (predictionId, predictionData) => {
    return apiCall('/bookmarks', 'POST', {
      bookmark_type: 'prediction',
      reference_id: predictionId,
      address: predictionData.address,
      floor_area: predictionData.floor_area,
      level: predictionData.level,
      unit_number: predictionData.unit_number,
      property_type: predictionData.property_type
    });
  },

  // Helper method to create comparison bookmark
  bookmarkComparison: async (comparisonId, comparisonData) => {
    return apiCall('/bookmarks', 'POST', {
      bookmark_type: 'comparison',
      reference_id: comparisonId,
      address: comparisonData.address1,
      floor_area: comparisonData.floor_area1,
      level: comparisonData.level1,
      unit_number: comparisonData.unit_number1,
      property_type: comparisonData.property_type1,
      address_2: comparisonData.address2,
      floor_area_2: comparisonData.floor_area2,
      level_2: comparisonData.level2,
      unit_number_2: comparisonData.unit_number2,
      property_type_2: comparisonData.property_type2
    });
  },

  deleteBookmark: async (bookmarkId) => {
    return apiCall(`/bookmarks/${bookmarkId}`, 'DELETE');
  },

  // Admin Dashboard API calls
  getAdminMetrics: async () => {
    return apiCall('/admin/metrics');
  },

  getAllUsers: async (page = 1, perPage = 20) => {
    return apiCall(`/admin/users?page=${page}&per_page=${perPage}`);
  },

  getUserById: async (userId) => {
    return apiCall(`/admin/users/${userId}`);
  },

  updateUser: async (userId, userData) => {
    return apiCall(`/admin/users/${userId}`, 'PUT', userData);
  },

  deactivateUser: async (userId) => {
    return apiCall(`/admin/users/${userId}/deactivate`, 'POST');
  },

  suspendUser: async (userId) => {
    return apiCall(`/admin/users/${userId}/suspend`, 'POST');
  },

  reactivateUser: async (userId) => {
    return apiCall(`/admin/users/${userId}/reactivate`, 'POST');
  },

  // Delete user completely (hard delete)
  deleteUser: async (userId) => {
    return apiCall(`/admin/users/${userId}/delete`, 'DELETE');
  },

  // Admin Property Management
  getAllPropertiesAdmin: async (page = 1, perPage = 20) => {
    return apiCall(`/admin/properties?page=${page}&per_page=${perPage}`);
  },

  deletePropertyAdmin: async (propertyId) => {
    return apiCall(`/admin/properties/${propertyId}`, 'DELETE');
  },

  getAllReviews: async (page = 1, perPage = 20, filterLegit = false, includeML = true, minConfidence = 0.7) => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      filter_legit: filterLegit.toString(),
      include_ml: includeML.toString(),
      min_confidence: minConfidence.toString()
    });
    return apiCall(`/admin/reviews?${params.toString()}`);
  },

  getAllFeedback: async (page = 1, perPage = 20, filterLegit = false, includeML = true, minConfidence = 0.7) => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      filter_legit: filterLegit.toString(),
      include_ml: includeML.toString(),
      min_confidence: minConfidence.toString()
    });
    return apiCall(`/admin/feedback?${params.toString()}`);
  },
  
  // Feedback Form Types Management (Admin)
  getAllFeedbackFormTypes: async () => {
    return apiCall('/admin/feedback/form-types');
  },
  
  createFeedbackFormType: async (typeData) => {
    return apiCall('/admin/feedback/form-types', 'POST', typeData);
  },
  
  updateFeedbackFormType: async (typeId, typeData) => {
    return apiCall(`/admin/feedback/form-types/${typeId}`, 'PUT', typeData);
  },
  
  deleteFeedbackFormType: async (typeId) => {
    return apiCall(`/admin/feedback/form-types/${typeId}`, 'DELETE');
  },

  verifyFeedback: async (feedbackId) => {
    return apiCall('/admin/feedback/verify', 'POST', { 
      feedback_id: feedbackId
    });
  },

  respondToFeedback: async (feedbackId, adminResponse, type = 'review') => {
    return apiCall('/admin/feedback/respond', 'POST', { 
      feedback_id: feedbackId,
      admin_response: adminResponse,
      type: type
    });
  },

  getFeedbackById: async (feedbackId, type = 'review') => {
    return apiCall(`/admin/feedback/${feedbackId}?type=${type}`);
  },

  unverifyFeedback: async (feedbackId) => {
    return apiCall('/admin/feedback/unverify', 'POST', { 
      feedback_id: feedbackId
    });
  },

  // Regions Management API calls
  getAllRegions: async () => {
    return apiCall('/admin/regions');
  },

  getRegionById: async (regionId) => {
    return apiCall(`/admin/regions/${regionId}`);
  },

  createRegion: async (regionData) => {
    return apiCall('/admin/regions', 'POST', regionData);
  },

  updateRegion: async (regionId, regionData) => {
    return apiCall(`/admin/regions/${regionId}`, 'PUT', regionData);
  },

  deleteRegion: async (regionId) => {
    return apiCall(`/admin/regions/${regionId}`, 'DELETE');
  },
};

// Properties API calls
export const propertiesAPI = {
  // Get all properties with pagination
  getAll: async (page = 1, perPage = 8) => {
    return apiCall(`/properties?page=${page}&per_page=${perPage}`);
  },

  // Get property by ID
  getById: async (id) => {
    return apiCall(`/properties/${id}`);
  },

  // Search properties (you can add filters later)
  search: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiCall(`/properties/search?${queryParams}`);
  },

  // Get agent's properties
  getAgentProperties: async () => {
    return apiCall('/properties/agent');
  },

  // Get nearby properties for comparison/prediction
  getNearbyProperties: async (address, limit = 10, propertyType = null) => {
    return apiCall('/properties/nearby', 'POST', { address, limit, propertyType });
  },

  // Filter properties by nearby amenities
  filterByAmenities: async (amenityTypes, radius = 1000) => {
    return apiCall('/properties/filter-by-amenities', 'POST', { 
      amenity_types: amenityTypes,
      radius 
    });
  },

  // Get agents assigned to a specific region
  getAgentsByRegion: async (address, propertyType = null) => {
    return apiCall('/agents/region', 'POST', { address, property_type: propertyType });
  },


};

// FAQ API calls
export const faqAPI = {
  // FAQ Section
  getSection: () => apiCall('/faq/section'),
  updateSection: (sectionData) => apiCall('/faq/section', 'PUT', sectionData),
  
  // FAQ Entries
  getEntries: () => apiCall('/faq/entries'),
  getEntry: (faqId) => apiCall(`/faq/entries/${faqId}`),
  createEntry: (faqData) => apiCall('/faq/entries', 'POST', faqData),
  updateEntry: (faqId, faqData) => apiCall(`/faq/entries/${faqId}`, 'PUT', faqData),
  deleteEntry: (faqId) => apiCall(`/faq/entries/${faqId}`, 'DELETE'),
  
  // Legacy method for backward compatibility
  getAll: async () => {
    return apiCall('/support/faq');
  },
};

// Content API calls
export const contentAPI = {
  // Get content sections
  getSections: async () => {
    return apiCall('/content/sections');
  },
};

// Support API calls
export const supportAPI = {
  // Get FAQ entries
  getFAQ: async () => {
    return apiCall('/support/faq');
  },

  // Get contact information
  getContact: async () => {
    return apiCall('/support/contact');
  },

  // Get legal content
  getLegal: async () => {
    return apiCall('/support/legal');
  },

  // Get specific legal content
  getLegalContent: async (contentType) => {
    return apiCall(`/support/legal/${contentType}`);
  },
};

// Hero API calls
export const heroAPI = {
  // Get hero content
  getContent: async () => {
    return apiCall('/hero/content');
  },

  // Get specific hero section content
  getContentBySection: async (sectionName) => {
    return apiCall(`/hero/content/${sectionName}`);
  },

  // Upload hero background image
  uploadBackground: async (file) => {
    const url = `${API_BASE_URL}/hero/upload-background`;
    const token = localStorage.getItem('accessToken');
    
    const formData = new FormData();
    formData.append('file', file);
    
    const options = {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let the browser set it with boundary
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    };

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  },

  // Upload hero marketing video
  uploadVideo: async (file) => {
    const url = `${API_BASE_URL}/hero/upload-video`;
    const token = localStorage.getItem('accessToken');
    
    const formData = new FormData();
    formData.append('file', file);
    
    const options = {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let the browser set it with boundary
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    };

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  },

  // Update hero content
  updateContent: async (contentData) => {
    return apiCall('/hero/update-content', 'POST', contentData);
  },
};

// HowItWorks API calls
export const howitworksAPI = {
  // Get all HowItWorks properties
  getProperties: async () => {
    return apiCall('/howitworks/properties');
  },

  // Get specific HowItWorks property
  getProperty: async (propertyId) => {
    return apiCall(`/howitworks/properties/${propertyId}`);
  },

  // Update HowItWorks property
  updateProperty: async (propertyId, propertyData) => {
    return apiCall(`/howitworks/properties/${propertyId}`, 'PUT', propertyData);
  },
  // Create HowItWorks property
  createProperty: async (propertyData) => {
    return apiCall('/howitworks/properties', 'POST', propertyData);
  },
};

// Features API calls
export const featuresAPI = {
  // Get all features steps
  getSteps: async () => {
    return apiCall('/features/steps');
  },

  // Get specific features step
  getStep: async (stepId) => {
    return apiCall(`/features/steps/${stepId}`);
  },

  // Update features step
  updateStep: async (stepId, stepData) => {
    return apiCall(`/features/steps/${stepId}`, 'PUT', stepData);
  },

  // Create features step
  createStep: async (stepData) => {
    return apiCall('/features/steps', 'POST', stepData);
  },

  // Delete features step
  deleteStep: async (stepId) => {
    return apiCall(`/features/steps/${stepId}`, 'DELETE');
  },

  // Get features section title
  getSectionTitle: async () => {
    return apiCall('/features/section-title');
  },

  // Update features section title
  updateSectionTitle: async (sectionTitle, tutorialVideoUrl = null) => {
    return apiCall('/features/section-title', 'PUT', { 
      section_title: sectionTitle,
      tutorial_video_url: tutorialVideoUrl 
    });
  },

  // Upload features step tutorial video
  uploadVideo: async (file) => {
    const url = `${API_BASE_URL}/features/upload-video`;
    const token = localStorage.getItem('accessToken');
    
    const formData = new FormData();
    formData.append('file', file);
    
    const options = {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let the browser set it with boundary
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    };

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  },

  // Update tutorial video URL for the section
  updateTutorialVideo: async (videoUrl) => {
    return apiCall('/features/tutorial-video', 'PUT', { tutorial_video_url: videoUrl });
  },
};

// Team API calls
export const teamAPI = {
  // Get team section details
  getSection: async () => {
    return apiCall('/team/section');
  },

  // Update team section details
  updateSection: async (sectionData) => {
    return apiCall('/team/section', 'PUT', sectionData);
  },

  // Get all team members
  getMembers: async () => {
    return apiCall('/team/members');
  },

  // Get specific team member
  getMember: async (memberId) => {
    return apiCall(`/team/members/${memberId}`);
  },

  // Create team member
  createMember: async (memberData) => {
    return apiCall('/team/members', 'POST', memberData);
  },

  // Update team member
  updateMember: async (memberId, memberData) => {
    return apiCall(`/team/members/${memberId}`, 'PUT', memberData);
  },

  // Delete team member
  deleteMember: async (memberId) => {
    return apiCall(`/team/members/${memberId}`, 'DELETE');
  },

  // Upload team member profile picture
  uploadProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append('profile_picture', file);
    
    // Get token for manual request since we need to override Content-Type
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}/team/members/upload-profile-picture`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type - let browser set it with boundary
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  },
};

// Contact Information API calls
export const contactAPI = {
  // Get contact information
  getInfo: async () => {
    return apiCall('/contact/info');
  },

  // Update contact information
  updateInfo: async (contactData) => {
    return apiCall('/contact/info', 'PUT', contactData);
  },
};

export const trialAPI = {
  // Check trial status
  checkStatus: async () => {
    return apiCall('/trial/check');
  },

  // Start trial
  startTrial: async () => {
    return apiCall('/trial/start', 'POST');
  },

  // Use trial prediction
  usePrediction: async () => {
    return apiCall('/trial/use-prediction', 'POST');
  },
};


// Price Prediction API calls
export const predictionAPI = {
  // Check prediction limit for free users
  checkLimit: async () => {
    return apiCall('/predictions/check-limit');
  },

  // Generate ML-based price prediction
  predictPrice: async (propertyData, options = {}) => {
    return apiCall('/predict-price', 'POST', propertyData, options);
  },

  // Test ML prediction without authentication
  predictPriceTest: async (propertyData, options = {}) => {
    return apiCall('/predict-price-test', 'POST', propertyData, options);
  },

  // Get user predictions
  getUserPredictions: async (userId) => {
    return apiCall(`/predictions/user/${userId}`);
  },

  // Create price prediction (legacy method)
  create: async (predictionData) => {
    return apiCall('/predictions', 'POST', predictionData);
  },
};

// Bookmarks API calls
export const bookmarksAPI = {
  // Get all bookmarks for current user
  getAll: async () => {
    return apiCall('/bookmarks');
  },

  // Create a new bookmark
  create: async (bookmarkData) => {
    return apiCall('/bookmarks', 'POST', bookmarkData);
  },

  // Delete a bookmark
  delete: async (bookmarkId) => {
    return apiCall(`/bookmarks/${bookmarkId}`, 'DELETE');
  },

  // Check if a bookmark exists
  checkExists: async (bookmarkType, referenceId) => {
    const bookmarks = await apiCall('/bookmarks');
    return bookmarks.bookmarked_addresses.concat(
      bookmarks.bookmarked_predictions,
      bookmarks.bookmarked_comparisons
    ).some(bookmark => 
      bookmark.bookmark_type === bookmarkType && 
      bookmark.reference_id === referenceId
    );
  },
};

// Onboarding API calls
export const onboardingAPI = {
  completeUser: async () => {
    return apiCall('/onboarding/complete', 'POST');
  },

  completeAgent: async () => {
    return apiCall('/onboarding/complete-agent', 'POST');
  },

  checkAgentStatus: async () => {
    return apiCall('/onboarding/agent-status');
  },

  checkUserStatus: async () => {
    return apiCall('/onboarding/user-status');
  },

  saveUserPreferences: async (preferences) => {
    return apiCall('/onboarding/save-preferences', 'POST', preferences);
  },

  getUserRecommendations: async () => {
    return apiCall('/recommendations');
  },

  getUserPreferences: async () => {
    return apiCall('/user/preferences');
  },
};

// Agent API calls
export const agentAPI = {
  // Get agent dashboard statistics
  getDashboardStats: async () => {
    return apiCall('/agent/dashboard-stats');
  },

  // Get agent's assigned regions
  getAssignedRegions: async () => {
    return apiCall('/agent/regions');
  },

  // Update agent's assigned regions
  updateAssignedRegions: async (regions) => {
    return apiCall('/agent/regions', 'POST', { regions });
  },

  // Get agent's recent activity
  getRecentActivity: async () => {
    return apiCall('/agent/recent-activity');
  },

  // Get agent's properties (listings)
  getAgentProperties: async () => {
    return apiCall('/properties/agent');
  },

  // Get single agent property by ID
  getAgentProperty: async (propertyId) => {
    return apiCall(`/properties/agent/${propertyId}`);
  },

  // Create new property listing
  createProperty: async (propertyData) => {
    return apiCall('/properties/agent', 'POST', propertyData);
  },

  // Update property listing
  updateProperty: async (propertyId, propertyData) => {
    return apiCall(`/properties/agent/${propertyId}`, 'PUT', propertyData);
  },

  // Delete property listing
  deleteProperty: async (propertyId) => {
    return apiCall(`/properties/agent/${propertyId}`, 'DELETE');
  },

  // Upload property images
  uploadPropertyImages: async (formData) => {
    const url = `${API_BASE_URL}/properties/upload-images`;
    const token = localStorage.getItem('accessToken');
    
    const options = {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let the browser set it with boundary
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    };

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  },
};

// Export the main API object
// Legal Content API
export const legalAPI = {
  getContent: (contentType) => apiCall(`/legal/${contentType}`),
  updateContent: (contentType, contentData) => apiCall(`/legal/${contentType}`, 'PUT', contentData),
  getAllContent: () => apiCall('/legal/all'),
};

// Reviews API
export const reviewsAPI = {
  getVerifiedReviews: () => apiCall('/reviews/verified'),
};

// Subscription Plans API
export const subscriptionPlansAPI = {
  getAll: () => apiCall('/subscription-plans'),
  getById: (id) => apiCall(`/subscription-plans/${id}`),
  // Admin endpoints
  admin: {
    create: (data) => apiCall('/admin/subscription-plans', 'POST', data),
    update: (id, data) => apiCall(`/admin/subscription-plans/${id}`, 'PUT', data),
    delete: (id) => apiCall(`/admin/subscription-plans/${id}`, 'DELETE'),
  }
};

// Important Features API
export const importantFeaturesAPI = {
  getAll: () => apiCall('/important-features'),
  // Admin endpoints
  admin: {
    create: (data) => apiCall('/admin/important-features', 'POST', data),
    update: (id, data) => apiCall(`/admin/important-features/${id}`, 'PUT', data),
    delete: (id) => apiCall(`/admin/important-features/${id}`, 'DELETE'),
  }
};

// Property Card Export API
export const propertyCardAPI = {
  exportExcel: async (data) => {
    const url = `${API_BASE_URL}/property-card/export-excel`;
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to generate Excel report' }));
      throw new Error(errorData.error || 'Failed to generate Excel report');
    }
    
    // Get blob and create download link
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    // Extract filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'property-report.xlsx';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
        // Handle URL encoding
        try {
          filename = decodeURIComponent(filename);
        } catch (e) {
          // If decoding fails, use as is
        }
      }
    }
    
    // Create download link - completely isolated to prevent React Router interference
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    
    // Style to be completely hidden and non-interactive
    Object.assign(link.style, {
      display: 'none',
      visibility: 'hidden',
      position: 'absolute',
      top: '-9999px',
      left: '-9999px',
      width: '1px',
      height: '1px',
      opacity: '0',
      pointerEvents: 'none'
    });
    
    // Prevent link from being detected by React Router or any navigation handlers
    link.setAttribute('data-react-router-ignore', 'true');
    
    // Append to a container that's outside React's control
    const container = document.createElement('div');
    container.style.display = 'none';
    container.appendChild(link);
    document.body.appendChild(container);
    
    // Use microtask to trigger download after DOM is updated
    Promise.resolve().then(() => {
      // Trigger download
      link.click();
      
      // Remove immediately after click to prevent any interference
      setTimeout(() => {
        try {
          if (container.parentNode) {
            document.body.removeChild(container);
          }
        } catch (e) {
          // Ignore cleanup errors
        }
        
        // Revoke URL after download has initiated
        setTimeout(() => {
          try {
            window.URL.revokeObjectURL(downloadUrl);
          } catch (e) {
            // Ignore revocation errors
          }
        }, 200);
      }, 0);
    });
    
    return { success: true };
  }
};

export default {
  auth: authAPI,
  properties: propertiesAPI,
  faq: faqAPI,
  content: contentAPI,
  support: supportAPI,
  hero: heroAPI,
  howitworks: howitworksAPI,
  features: featuresAPI,
  team: teamAPI,
  contact: contactAPI,
  prediction: predictionAPI,
  bookmarks: bookmarksAPI,
  onboarding: onboardingAPI,
  agent: agentAPI,
  legal: legalAPI,
  reviews: reviewsAPI,
  subscriptionPlans: subscriptionPlansAPI,
  importantFeatures: importantFeaturesAPI,
};
