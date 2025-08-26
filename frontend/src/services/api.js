const API_BASE_URL = 'http://localhost:5000/api';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get JWT token from localStorage
  const token = localStorage.getItem('accessToken');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      // Add Authorization header if token exists
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
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
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // User login
  login: async (credentials) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Send OTP for email verification
  sendOTP: async (email) => {
    return apiCall('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    return apiCall('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  // Forgot password - send recovery OTP
  forgotPassword: async (email) => {
    return apiCall('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Reset password with OTP
  resetPassword: async (email, otp, newPassword) => {
    return apiCall('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, new_password: newPassword }),
    });
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
    return apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    return apiCall('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
  },

  // Delete account
  deleteAccount: async () => {
    return apiCall('/auth/deactivate', {
      method: 'POST',
    });
  },

  // Deactivate own account
  deactivateOwnAccount: async () => {
    return apiCall('/user/deactivate', {
      method: 'POST',
    });
  },

  // Upgrade to Premium
  upgradeToPremium: async () => {
    return apiCall('/auth/upgrade-to-premium', {
      method: 'POST',
    });
  },

  // Downgrade to Free
  downgradeToFree: async () => {
    return apiCall('/auth/downgrade-to-free', {
      method: 'POST',
    });
  },

  // Get user properties and recommendations
  getUserProperties: async () => {
    return apiCall('/user/properties');
  },

  // Get published reviews for feedback page
  getPublishedReviews: async () => {
    return apiCall('/feedback/reviews');
  },

  // Submit new feedback/review
  submitFeedback: async (feedbackData) => {
    return apiCall('/feedback/submit', {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  },

  // Get current user's reviews
  getMyReviews: async () => {
    return apiCall('/feedback/my-reviews');
  },

  // Like a review
  likeReview: async (reviewId) => {
    return apiCall('/feedback/like', {
      method: 'POST',
      body: JSON.stringify({ review_id: reviewId }),
    });
  },

  // Dislike a review
  dislikeReview: async (reviewId) => {
    return apiCall('/feedback/dislike', {
      method: 'POST',
      body: JSON.stringify({ review_id: reviewId }),
    });
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
    
    return apiCall('/bookmarks', {
      method: 'POST',
      body: JSON.stringify(defaultData),
    });
  },

  // Helper method to create property bookmark
  bookmarkProperty: async (propertyId, propertyData) => {
    return apiCall('/bookmarks', {
      method: 'POST',
      body: JSON.stringify({
        bookmark_type: 'property',
        reference_id: propertyId,
        address: propertyData.address,
        floor_area: propertyData.floor_area,
        level: propertyData.level,
        unit_number: propertyData.unit_number,
        property_type: propertyData.property_type
      }),
    });
  },

  // Helper method to create prediction bookmark
  bookmarkPrediction: async (predictionId, predictionData) => {
    return apiCall('/bookmarks', {
      method: 'POST',
      body: JSON.stringify({
        bookmark_type: 'prediction',
        reference_id: predictionId,
        address: predictionData.address,
        floor_area: predictionData.floor_area,
        level: predictionData.level,
        unit_number: predictionData.unit_number,
        property_type: predictionData.property_type
      }),
    });
  },

  // Helper method to create comparison bookmark
  bookmarkComparison: async (comparisonId, comparisonData) => {
    return apiCall('/bookmarks', {
      method: 'POST',
      body: JSON.stringify({
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
      }),
    });
  },

  deleteBookmark: async (bookmarkId) => {
    return apiCall(`/bookmarks/${bookmarkId}`, {
      method: 'DELETE',
    });
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

  deactivateUser: async (userId) => {
    return apiCall(`/admin/users/${userId}/deactivate`, {
      method: 'POST',
    });
  },

  suspendUser: async (userId) => {
    return apiCall(`/admin/users/${userId}/suspend`, {
      method: 'POST',
    });
  },

  reactivateUser: async (userId) => {
    return apiCall(`/admin/users/${userId}/reactivate`, {
      method: 'POST',
    });
  },

  getAllFeedback: async (page = 1, perPage = 20) => {
    return apiCall(`/admin/feedback?page=${page}&per_page=${perPage}`);
  },

  verifyFeedback: async (feedbackId) => {
    return apiCall('/admin/feedback/verify', {
      method: 'POST',
      body: JSON.stringify({ 
        feedback_id: feedbackId
      }),
    });
  },

  respondToFeedback: async (feedbackId, adminResponse) => {
    return apiCall('/admin/feedback/respond', {
      method: 'POST',
      body: JSON.stringify({ 
        feedback_id: feedbackId,
        admin_response: adminResponse
      }),
    });
  },

  getFeedbackById: async (feedbackId) => {
    return apiCall(`/admin/feedback/${feedbackId}`, {
      method: 'GET',
    });
  },

  unverifyFeedback: async (feedbackId) => {
    return apiCall('/admin/feedback/unverify', {
      method: 'POST',
      body: JSON.stringify({ 
        feedback_id: feedbackId
      }),
    });
  },
};

// Properties API calls
export const propertiesAPI = {
  // Get all properties
  getAll: async () => {
    return apiCall('/properties');
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
    return apiCall('/properties/nearby', {
      method: 'POST',
      body: JSON.stringify({ address, limit, propertyType }),
    });
  },

  // Get agents assigned to a specific region
  getAgentsByRegion: async (address) => {
    return apiCall('/agents/region', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  },


};

// FAQ API calls
export const faqAPI = {
  // Get all FAQ entries
  getAll: async () => {
    return apiCall('/faq');
  },
};

// Content API calls
export const contentAPI = {
  // Get content sections
  getSections: async () => {
    return apiCall('/content/sections');
  },
};

// Price Prediction API calls
export const predictionAPI = {
  // Create price prediction
  create: async (predictionData) => {
    return apiCall('/predictions', {
      method: 'POST',
      body: JSON.stringify(predictionData),
    });
  },

  // Get user predictions
  getUserPredictions: async (userId) => {
    return apiCall(`/predictions/user/${userId}`);
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
    return apiCall('/bookmarks', {
      method: 'POST',
      body: JSON.stringify(bookmarkData),
    });
  },

  // Delete a bookmark
  delete: async (bookmarkId) => {
    return apiCall(`/bookmarks/${bookmarkId}`, {
      method: 'DELETE',
    });
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
    return apiCall('/onboarding/complete', {
      method: 'POST',
    });
  },

  completeAgent: async () => {
    return apiCall('/onboarding/complete-agent', {
      method: 'POST',
    });
  },

  checkAgentStatus: async () => {
    return apiCall('/onboarding/agent-status');
  },

  saveUserPreferences: async (preferences) => {
    return apiCall('/onboarding/save-preferences', {
      method: 'POST',
      body: JSON.stringify(preferences),
    });
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
    return apiCall('/agent/regions', {
      method: 'POST',
      body: JSON.stringify({ regions }),
    });
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
    return apiCall('/properties/agent', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  },

  // Update property listing
  updateProperty: async (propertyId, propertyData) => {
    return apiCall(`/properties/agent/${propertyId}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    });
  },

  // Delete property listing
  deleteProperty: async (propertyId) => {
    return apiCall(`/properties/agent/${propertyId}`, {
      method: 'DELETE',
    });
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
export default {
  auth: authAPI,
  properties: propertiesAPI,
  faq: faqAPI,
  content: contentAPI,
  prediction: predictionAPI,
  bookmarks: bookmarksAPI,
  onboarding: onboardingAPI,
  agent: agentAPI,
};
