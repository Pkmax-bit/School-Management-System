/**
 * Authentication Helper
 * Manages authentication tokens for API requests
 */

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  // Check for JWT token
  const jwtToken = localStorage.getItem('auth_token');
  if (jwtToken) {
    console.log('✅ JWT token found');
    return true;
  }
  
  // Check for Supabase session
  // This will be handled by the API request function
  console.log('❌ No JWT token found');
  return false;
};

// Get authentication token
export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Set authentication token
export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
  console.log('✅ Auth token set');
};

// Clear authentication token
export const clearAuthToken = (): void => {
  localStorage.removeItem('auth_token');
  console.log('✅ Auth token cleared');
};

// Create a mock token for development
export const createMockToken = (): string => {
  const mockToken = 'mock-jwt-token-for-development';
  setAuthToken(mockToken);
  return mockToken;
};

// Check if we're in development mode
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

