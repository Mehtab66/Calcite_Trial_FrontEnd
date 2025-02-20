import React, { createContext, useContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  // Retrieve token from localStorage on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserRole = localStorage.getItem("userRole");
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedToken) {
      setToken(storedToken);
      setUserRole(storedUserRole);
      setUser(storedUser);
    }
    setLoading(false); // Set loading to false after checking storage
  }, []);

  const StoreTokenAndRole = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userRole", user.role);
    localStorage.setItem("user", JSON.stringify(user));
    setToken(token);
    setUserRole(user.role);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    setToken(null);
    setUserRole("");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, userRole, user, StoreTokenAndRole, logout, loading }} // Expose loading
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
