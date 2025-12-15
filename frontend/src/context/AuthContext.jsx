import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- RESTORE SESSION ---------------- */
  useEffect(() => {
    const storedToken = localStorage.getItem("tyrefusion_token");
    const storedUser = localStorage.getItem("tyrefusion_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  /* ---------------- LOGIN ---------------- */
  const login = ({ token, user }) => {
    localStorage.setItem("tyrefusion_token", token);
    localStorage.setItem("tyrefusion_user", JSON.stringify(user));

    setToken(token);
    setUser(user);
  };

  /* ---------------- LOGOUT ---------------- */
  const logout = () => {
    localStorage.removeItem("tyrefusion_token");
    localStorage.removeItem("tyrefusion_user");

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
