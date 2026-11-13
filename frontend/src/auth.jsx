import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api, unwrap } from "./api";
import { Spinner } from "@/components/ui/spinner";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/auth/current-user")
      .then((res) => setUser(unwrap(res)))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (identifier, password) => {
    const body = identifier.includes("@")
      ? { email: identifier, password }
      : { userName: identifier, password };
    const res = await api.post("/auth/login", body);
    setUser(unwrap(res).user);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
    }
  };

  // The server already ended the session (e.g. logout on another device)
  const signOutLocally = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signOutLocally }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Which of Google and GitHub the server has credentials for. Asked once per
// page load; an empty list hides the buttons.
let providersRequest = null;
export function useOAuthProviders() {
  const [providers, setProviders] = useState([]);
  useEffect(() => {
    let live = true;
    providersRequest ??= api
      .get("/auth/oauth/providers")
      .then((res) => unwrap(res)?.providers || [])
      .catch(() => {
        providersRequest = null;
        return [];
      });
    providersRequest.then((p) => live && setProviders(p));
    return () => {
      live = false;
    };
  }, []);
  return providers;
}

/** Where the browser goes to sign in with a provider; it comes back to `returnTo`. */
export const oauthStartUrl = (provider, returnTo = "/") =>
  `${api.defaults.baseURL.replace(/\/+$/, "")}/auth/oauth/${provider}?${new URLSearchParams({ returnTo })}`;

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner label="Loading your workspace" className="[&_svg]:size-6" />
      </div>
    );
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
