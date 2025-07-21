// Base URL for your backend API
const API_BASE_URL = 'http://localhost:5000/api';

// API service class
class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Get auth token from localStorage
    getAuthToken() {
        return localStorage.getItem('token');
    }

    // Set auth token in localStorage
    setAuthToken(token) {
        localStorage.setItem('token', token);
    }

    // Remove auth token from localStorage
    removeAuthToken() {
        localStorage.removeItem('token');
    }

    // Get default headers
    getHeaders(includeAuth = false) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (includeAuth) {
            const token = this.getAuthToken();
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
        }

        return headers;
    }

    // Generic API call method
    // Generic API call method
    async apiCall(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const config = {
            headers: this.getHeaders(options.requireAuth),
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                // Handle rate limiting
                if (response.status === 429) {
                    throw new Error('Too many requests. Please wait a moment before trying again.');
                }

                // Handle specific error cases
                if (response.status === 401) {
                    // Token expired or invalid
                    this.removeAuthToken();
                    throw new Error('Session expired. Please login again.');
                }

                // Handle validation errors (400 status)
                if (response.status === 400) {
                    // If the response has validation errors, include them in the error
                    if (data.errors && Array.isArray(data.errors)) {
                        // Create a structured error for frontend to handle
                        const errorObj = {
                            message: data.message || 'Validation failed',
                            errors: data.errors,
                            type: 'validation'
                        };
                        throw errorObj;
                    } else if (data.message) {
                        throw new Error(data.message);
                    } else {
                        throw new Error('Validation failed. Please check your input.');
                    }
                }

                // Handle other errors
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    }
    // Authentication methods
    async register(userData) {
        return this.apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async login(credentials) {
        return this.apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }

    async logout() {
        try {
            await this.apiCall('/auth/logout', {
                method: 'POST',
                requireAuth: true,
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always remove token on logout, even if API call fails
            this.removeAuthToken();
        }
    }

    async getProfile() {
        return this.apiCall('/auth/profile', {
            method: 'GET',
            requireAuth: true,
        });
    }

    async updateProfile(profileData) {
        return this.apiCall('/auth/profile', {
            method: 'PUT',
            requireAuth: true,
            body: JSON.stringify(profileData),
        });
    }

    async uploadProfileImage(imageFile) {
        const formData = new FormData();
        formData.append('profileImage', imageFile);
        
        return this.apiCall('/auth/profile-image', {
            method: 'PUT',
            body: formData,
            requireAuth: true,
            // Don't set Content-Type header for FormData
            headers: this.getHeaders(true, false)
        });
    }

    async verifyEmail(verificationData) {
        return this.apiCall('/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify(verificationData),
        });
    }

    async resendVerification(email) {
        return this.apiCall('/auth/resend-verification', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = this.getAuthToken();
        if (!token) return false;

        try {
            // Basic token validation (check if it's expired)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;

            if (payload.exp < currentTime) {
                this.removeAuthToken();
                return false;
            }

            return true;
        } catch (error) {
            console.error('Token validation error:', error);
            this.removeAuthToken();
            return false;
        }
    }

    // posts endpoint

    async createPost(postData) {
        return this.apiCall('/posts', {
            method: 'POST',
            body: postData, // FormData object
            requireAuth: true,
            // Don't set Content-Type header for FormData
            headers: this.getHeaders(true, false)
        });
    }

    async getPosts(page = 1, limit = 10) {
        return this.apiCall(`/posts?page=${page}&limit=${limit}`, {
            method: 'GET',
            requireAuth: true
        });
    }

    async searchPosts(query, page = 1, limit = 10) {
        return this.apiCall(`/posts/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
            method: 'GET',
            requireAuth: true
        });
    }

    async likePost(postId) {
        return this.apiCall(`/posts/${postId}/like`, {
            method: 'PUT',
            requireAuth: true
        });
    }

    async addComment(postId, content) {
        return this.apiCall(`/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content }),
            requireAuth: true
        });
    }

    async deletePost(postId) {
        return this.apiCall(`/posts/${postId}`, {
            method: 'DELETE',
            requireAuth: true
        });
    }

    // Update the getHeaders method to handle FormData
    getHeaders(includeAuth = false, includeContentType = true) {
        const headers = {};

        if (includeContentType) {
            headers['Content-Type'] = 'application/json';
        }

        if (includeAuth) {
            const token = this.getAuthToken();
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
        }

        return headers;
    }

    //   follow endpoints

    // Add these methods to your ApiService class

    // User exploration and follow methods
    async getExploreUsers(page = 1, limit = 20) {
        return this.apiCall(`/users/explore?page=${page}&limit=${limit}`, {
            method: 'GET',
            requireAuth: true
        });
    }

    async followUser(userId) {
        return this.apiCall(`/users/follow/${userId}`, {
            method: 'POST',
            requireAuth: true
        });
    }

    async unfollowUser(userId) {
        return this.apiCall(`/users/unfollow/${userId}`, {
            method: 'POST',
            requireAuth: true
        });
    }

    async getFollowers(userId, page = 1, limit = 20) {
        return this.apiCall(`/users/${userId}/followers?page=${page}&limit=${limit}`, {
            method: 'GET',
            requireAuth: true
        });
    }

    async getFollowing(userId, page = 1, limit = 20) {
        return this.apiCall(`/users/${userId}/following?page=${page}&limit=${limit}`, {
            method: 'GET',
            requireAuth: true
        });
    }

    async searchUsers(query, page = 1, limit = 20) {
        return this.apiCall(`/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
            method: 'GET',
            requireAuth: true
        });
    }

    async getUserProfile(userId) {
        return this.apiCall(`/users/profile/${userId}`, {
            method: 'GET',
            requireAuth: true
        });
    }

    // Add this method to your ApiService class
    async getUserPosts(userId, page = 1, limit = 10) {
        return this.apiCall(`/posts/user/${userId}?page=${page}&limit=${limit}`, {
            method: 'GET',
            requireAuth: true
        });
    }

    // Add these methods to your ApiService class

    // Notification methods
    async getNotifications(page = 1, limit = 20, type = undefined) {
        let url = `/notifications?page=${page}&limit=${limit}`;
        if (type) {
            url += `&type=${type}`;
        }
        return this.apiCall(url, {
            method: 'GET',
            requireAuth: true
        });
    }

    async markNotificationAsRead(notificationId) {
        return this.apiCall(`/notifications/${notificationId}/read`, {
            method: 'PUT',
            requireAuth: true
        });
    }

    async markAllNotificationsAsRead() {
        return this.apiCall('/notifications/mark-all-read', {
            method: 'PUT',
            requireAuth: true
        });
    }

    async deleteNotification(notificationId) {
        return this.apiCall(`/notifications/${notificationId}`, {
            method: 'DELETE',
            requireAuth: true
        });
    }

    async bulkMarkNotificationsAsRead(notificationIds) {
        return this.apiCall('/notifications/bulk/mark-read', {
            method: 'PUT',
            body: JSON.stringify({ notificationIds }),
            requireAuth: true
        });
    }

    async bulkDeleteNotifications(notificationIds) {
        return this.apiCall('/notifications/bulk/delete', {
            method: 'DELETE',
            body: JSON.stringify({ notificationIds }),
            requireAuth: true
        });
    }

    async getUnreadNotificationCount() {
        return this.apiCall('/notifications/unread-count', {
            method: 'GET',
            requireAuth: true
        });
    }

    async getSubscriptionDetails() {
        return this.apiCall('/subscription/details', {
          method: 'GET',
          requireAuth: true
        });
      }
      
      async createCheckoutSession() {
        return this.apiCall('/subscription/create-checkout-session', {
          method: 'POST',
          requireAuth: true
        });
      }
      
      async cancelSubscription() {
        return this.apiCall('/subscription/cancel', {
          method: 'POST',
          requireAuth: true
        });
      }
      
      async reactivateSubscription() {
        return this.apiCall('/subscription/reactivate', {
          method: 'POST',
          requireAuth: true
        });
      }
      
      async getSubscriptionStatus() {
        return this.apiCall('/subscription/status', {
          method: 'GET',
          requireAuth: true
        });
      }
      

    // Health check
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
            return await response.json();
        } catch (error) {
            console.error('Health check failed:', error);
            throw error;
        }
    }
}



// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Export individual methods for convenience
export const {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    uploadProfileImage,
    isAuthenticated,
    createPost,        // Add this
    getPosts,          // Add this
    searchPosts,       // Add this
    likePost,          // Add this
    addComment,        // Add this
    deletePost,        // Add this
    healthCheck,
    getAuthToken,
    setAuthToken,
    removeAuthToken,
    verifyEmail,
    resendVerification,
    getExploreUsers,    // Add this
    followUser,         // Add this
    unfollowUser,       // Add this
    getFollowers,       // Add this
    getFollowing,       // Add this
    searchUsers,        // Add this
    getUserProfile,
    getUserPosts,       // Add this
    getNotifications,           // Add this
    markNotificationAsRead,     // Add this
    markAllNotificationsAsRead, // Add this
    deleteNotification,         // Add this
    bulkMarkNotificationsAsRead,// Add this
    bulkDeleteNotifications,    // Add this
    getUnreadNotificationCount, // Add this
    getSubscriptionDetails,
    createCheckoutSession,
    cancelSubscription,
    reactivateSubscription,
    getSubscriptionStatus,
} = apiService;