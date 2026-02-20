import { createContext, useContext, useState, useEffect } from "react";
import { checkLogin, signOut } from "../utils/api";

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🔍 Auth: Checking session...");
    checkLogin()
      .then((res) => {
        console.log("✅ Auth: Session response received", res.data);
        if (res.data.loggedIn) setUser(res.data.user);
      })
      .catch((err) => {
        console.warn("⚠️ Auth: Session check failed", err.message);
      })
      .finally(() => {
        console.log("🏁 Auth: Initialization complete");
        setLoading(false);
      });
  }, []);

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
