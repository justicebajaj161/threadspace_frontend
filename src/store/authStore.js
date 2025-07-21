import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiService from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false,
      pendingVerification: null, // Store email for verification

      // Actions
      setUser: (user) => set({ user }),
      
      setToken: (token) => {
        if (token) {
          apiService.setAuthToken(token);
          set({ token, isAuthenticated: true });
        } else {
          apiService.removeAuthToken();
          set({ token: null, isAuthenticated: false });
        }
      },
      // Helper methods for socket context
      getAuthToken: () => {
        const state = get();
        return state.token || apiService.getAuthToken();
      },

      setAuthToken: (token) => {
        get().setToken(token);
      },

      removeAuthToken: () => {
        get().setToken(null);
      },

      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),

      // Add new actions
      setPendingVerification: (email) => set({ pendingVerification: email }),
      
      clearPendingVerification: () => set({ pendingVerification: null }),

      // Update register action
      register: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.register(userData);
          
          if (response.success) {
            // Registration successful but needs verification
            if (response.data.requiresVerification) {
              set({ 
                isLoading: false,
                error: null,
                pendingVerification: response.data.email,
                user: null,
                token: null,
                isAuthenticated: false
              });
              
              return { 
                success: true, 
                requiresVerification: true,
                email: response.data.email,
                message: response.message
              };
            } else {
              // Direct registration (if verification is disabled)
              const { user, token } = response.data;
              get().setToken(token);
              localStorage.setItem('user', JSON.stringify(user));
              
              set({ 
                user,
                isLoading: false,
                error: null,
                pendingVerification: null
              });
              
              return { success: true, user };
            }
          }
        } catch (error) {
          console.error('Registration error:', error);
          
          let errorMessage = 'Registration failed. Please try again.';
          let fieldErrors = {};
          
          if (error.type === 'validation' && error.errors) {
            error.errors.forEach(err => {
              if (err.path) {
                fieldErrors[err.path] = err.msg || err.message;
              }
            });
            
            if (Object.keys(fieldErrors).length > 0) {
              set({ 
                isLoading: false, 
                error: null,
                user: null,
                token: null,
                isAuthenticated: false
              });
              
              return { success: false, error: error.message, fieldErrors };
            }
          }
          
          if (error.message) {
            if (error.message.includes('User already exists')) {
              errorMessage = 'An account with this email already exists.';
            } else if (error.message.includes('Too many requests')) {
              errorMessage = 'Too many registration attempts. Please wait a moment and try again.';
            } else {
              errorMessage = error.message;
            }
          }
          
          set({ 
            isLoading: false, 
            error: errorMessage,
            user: null,
            token: null,
            isAuthenticated: false
          });
          
          return { success: false, error: errorMessage };
        }
      },

      // Add email verification action
      verifyEmail: async (email, otp) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.verifyEmail({ email, otp });
          
          if (response.success) {
            const { user, token } = response.data;
            
            // Set token and user data
            get().setToken(token);
            localStorage.setItem('user', JSON.stringify(user));
            
            set({ 
              user,
              isLoading: false,
              error: null,
              pendingVerification: null
            });
            
            return { success: true, user, message: response.message };
          }
        } catch (error) {
          console.error('Email verification error:', error);
          
          let errorMessage = 'Email verification failed. Please try again.';
          
          if (error.message) {
            if (error.message.includes('Invalid or expired')) {
              errorMessage = 'Invalid or expired verification code. Please try again.';
            } else if (error.message.includes('already verified')) {
              errorMessage = 'Email is already verified. Please try logging in.';
            } else {
              errorMessage = error.message;
            }
          }
          
          set({ 
            isLoading: false, 
            error: errorMessage
          });
          
          return { success: false, error: errorMessage };
        }
      },

      // Add resend verification action
      resendVerification: async (email) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.resendVerification(email);
          
          if (response.success) {
            set({ 
              isLoading: false,
              error: null
            });
            
            return { success: true, message: response.message };
          }
        } catch (error) {
          console.error('Resend verification error:', error);
          
          let errorMessage = 'Failed to resend verification email. Please try again.';
          
          if (error.message) {
            if (error.message.includes('Too many requests')) {
              errorMessage = 'Too many requests. Please wait a moment before trying again.';
            } else {
              errorMessage = error.message;
            }
          }
          
          set({ 
            isLoading: false, 
            error: errorMessage
          });
          
          return { success: false, error: errorMessage };
        }
      },

      // Update login action to handle verification requirement
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.login(credentials);
          
          if (response.success) {
            const { user, token } = response.data;
            
            get().setToken(token);
            localStorage.setItem('user', JSON.stringify(user));
            
            set({ 
              user,
              isLoading: false,
              error: null,
              pendingVerification: null
            });
            
            return { success: true, user };
          }
        } catch (error) {
          console.error('Login error:', error);
          
          let errorMessage = 'Login failed. Please try again.';
          
          if (error.message) {
            if (error.message.includes('Invalid email or password')) {
              errorMessage = 'Invalid email or password. Please check your credentials and try again.';
            } else if (error.message.includes('Account is deactivated')) {
              errorMessage = 'Your account has been deactivated. Please contact support for assistance.';
            } else if (error.message.includes('Email not verified')) {
              // Handle email verification requirement
              set({ 
                isLoading: false, 
                error: null,
                pendingVerification: credentials.email
              });
              
              return { 
                success: false, 
                error: 'Email not verified. Please verify your email first.',
                requiresVerification: true,
                email: credentials.email
              };
            } else if (error.message.includes('Too many authentication attempts')) {
              errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
            } else {
              errorMessage = error.message;
            }
          }
          
          set({ 
            isLoading: false, 
            error: errorMessage,
            user: null,
            token: null,
            isAuthenticated: false
          });
          
          return { success: false, error: errorMessage };
        }
      },

      // Logout action
      logout: async () => {
        set({ isLoading: true });
        
        try {
          await apiService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Always clear state even if API call fails
          set({ 
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            isInitialized: true // Keep initialized state
          });
          
          // Clear token from API service
          apiService.removeAuthToken();
        }
      },

      // Get user profile
      getProfile: async () => {
        const state = get();
        if (!state.isAuthenticated || !state.token) {
          return { success: false, error: 'Not authenticated' };
        }

        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.getProfile();
          
          if (response.success) {
            console.log('Profile response user:', response.data.user);
            
            // Store updated user data
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            set({ 
              user: response.data.user,
              isLoading: false,
              error: null 
            });
            
            return { success: true, user: response.data.user };
          }
        } catch (error) {
          console.error('Get profile error:', error);
          
          // If token is invalid, logout user
          if (error.message.includes('token') || error.message.includes('401')) {
            get().logout();
          } else {
            set({ 
              isLoading: false, 
              error: error.message || 'Failed to fetch profile' 
            });
          }
          
          return { success: false, error: error.message };
        }
      },

      // Update user profile
      updateProfile: async (profileData) => {
        const state = get();
        if (!state.isAuthenticated) {
          return { success: false, error: 'Not authenticated' };
        }

        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.updateProfile(profileData);
          
          if (response.success) {
            set({ 
              user: response.data.user,
              isLoading: false,
              error: null 
            });
            
            return { success: true, user: response.data.user };
          }
        } catch (error) {
          console.error('Update profile error:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to update profile' 
          });
          
          return { success: false, error: error.message };
        }
      },

      // Update profile image
      updateProfileImage: async (imageFile) => {
        const state = get();
        if (!state.isAuthenticated) {
          return { success: false, error: 'Not authenticated' };
        }

        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.uploadProfileImage(imageFile);
          
          if (response.success) {
            set({ 
              user: response.data.user,
              isLoading: false,
              error: null 
            });
            
            return { success: true, user: response.data.user };
          }
        } catch (error) {
          console.error('Update profile image error:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to upload profile image' 
          });
          
          return { success: false, error: error.message };
        }
      },

      // Initialize auth state - SIMPLIFIED VERSION
      initializeAuth: () => {
        const state = get();
        
        // Don't initialize if already initialized
        if (state.isInitialized) {
          return;
        }

        console.log('Initializing auth...');

        const token = apiService.getAuthToken();
        
        if (token && apiService.isAuthenticated()) {
          try {
            const userData = localStorage.getItem('user');
            console.log('Raw user data from localStorage:', userData);
            
            const user = userData ? JSON.parse(userData) : null;
            console.log('Parsed user data:', user);
            
            set({ 
              token,
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              isInitialized: true
            });
          } catch (error) {
            console.error('Error parsing user data:', error);
            get().logout();
            set({ isInitialized: true });
          }
        } else {
          // Token is invalid or expired
          console.log('No valid token found');
          set({ 
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            isInitialized: true
          });
          apiService.removeAuthToken();
          localStorage.removeItem('user');
        }
      },

      // Check authentication status - SIMPLIFIED
      checkAuth: () => {
        const state = get();
        
        if (!state.token || !state.isAuthenticated) {
          return false;
        }
        
        // Verify token is still valid
        if (!apiService.isAuthenticated()) {
          get().logout();
          return false;
        }
        
        return true;
      }

      
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        pendingVerification: state.pendingVerification
      }),
    }
  )
);

export default useAuthStore;