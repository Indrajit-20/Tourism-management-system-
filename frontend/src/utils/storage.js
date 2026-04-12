// ✅ Centralized Storage Helper - Strictly uses sessionStorage

export const Storage = {
  // Get token with strictly from sessionStorage
  getToken: () => {
    return sessionStorage.getItem("token");
  },

  // Get role strictly from sessionStorage
  getRole: () => {
    return sessionStorage.getItem("role");
  },

  // Get username strictly from sessionStorage
  getUsername: () => {
    return sessionStorage.getItem("username");
  },

  // Set all auth data to sessionStorage
  setAuth: (token, role, username) => {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("role", role);
    sessionStorage.setItem("username", username);
  },

  // Clear all auth data from sessionStorage
  clearAuth: () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("username");
  },

  // Check if user is logged in
  isLoggedIn: () => {
    return !!Storage.getToken();
  },

  // Get authorization header
  getAuthHeader: () => {
    const token = Storage.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};

export default Storage;
