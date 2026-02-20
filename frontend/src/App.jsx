import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AuthProvider, { useAuth } from "./context/AuthContext";

import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Links from "./pages/Links";
import Analytics from "./pages/Analytics";
import Security from "./pages/Security";
import Preview from "./pages/Preview";

// ── Protected Route Wrapper ──────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-border border-t-white animate-spin" />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/signin" replace />;
  
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Support both root and specific routes for signin */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Secure Preview (accessible without login) */}
          <Route path="/preview" element={<Preview />} />

          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/links" element={
            <ProtectedRoute>
              <Links />
            </ProtectedRoute>
          } />

          <Route path="/analytics" element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } />
          
          <Route path="/analytics/:shortId" element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } />

          <Route path="/security" element={
            <ProtectedRoute>
              <Security />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#0a0a0a",
              color: "#fff",
              border: "1px solid #1e1e1e",
              fontSize: "14px",
              padding: "12px 20px",
              borderRadius: "10px",
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
