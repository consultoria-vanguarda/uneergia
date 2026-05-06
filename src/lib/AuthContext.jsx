import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from "@/api/base44Client";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({ id: "supabase", public_settings: {} });

  useEffect(() => {
    checkAppState();
    const { data: subscription } = supabase.auth.onAuthStateChange(async () => {
      await checkUserAuth();
    });
    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const checkAppState = async () => {
    try {
      setAuthError(null);
      await checkUserAuth();
    } catch (error) {
      console.error("Unexpected auth context error:", error);
      setAuthError({
        type: "unknown",
        message: error.message || "An unexpected error occurred"
      });
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await db.auth.me();
      setUser(currentUser);
      setIsAuthenticated(Boolean(currentUser));
      setAuthError(currentUser ? null : { type: "auth_required", message: "Authentication required" });
    } catch (error) {
      console.error("User auth check failed:", error);
      setIsAuthenticated(false);
      setUser(null);
      setAuthError({ type: "auth_required", message: "Authentication required" });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    await db.auth.logout();
    if (shouldRedirect) window.location.assign("/login");
  };

  const navigateToLogin = () => {
    db.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
