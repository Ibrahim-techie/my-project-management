import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { api } from "./api";
import { useAuth } from "./auth.jsx";
import { useToast } from "@/components/ui/toast";

// The socket lives under /api so it rides the same proxy as the REST calls:
// Vite in development and the Vercel rewrite in production. Vercel cannot
// forward WebSockets, so there Socket.IO falls back to long-polling.
const SOCKET_PATH = "/api/socket.io";

const apiOrigin = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url || url.startsWith("/")) return undefined; // same origin
  return new URL(url).origin;
};

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, signOutLocally } = useAuth();
  const toast = useToast();
  const [socket, setSocket] = useState(null);
  const toastRef = useRef(toast);
  toastRef.current = toast;

  useEffect(() => {
    if (!user) return undefined;

    const s = io(apiOrigin(), {
      path: SOCKET_PATH,
      withCredentials: true,
      transports: ["polling", "websocket"],
    });

    // Access token ran out: refresh it over HTTP (sets a new cookie), then reconnect
    const refreshAndReconnect = async () => {
      try {
        await api.post("/auth/refresh-token");
        s.connect();
      } catch {
        signOutLocally();
      }
    };

    s.on("auth:expired", refreshAndReconnect);
    s.on("connect_error", (err) => {
      if (err.message === "Access token expired") refreshAndReconnect();
    });

    // Logged out or password changed elsewhere: this session is no longer valid
    s.on("auth:revoked", () => signOutLocally());

    s.on("task:assigned", ({ task }) => {
      toastRef.current(`You were assigned "${task.title}"`, { tone: "success" });
    });

    setSocket(s);
    return () => {
      s.removeAllListeners();
      s.disconnect();
      setSocket(null);
    };
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);

/**
 * Join a project's room while mounted and listen to its events.
 * `handlers` maps event name to callback; it may change on every render.
 */
export function useProjectEvents(projectId, handlers) {
  const socket = useSocket();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const events = Object.keys(handlers).sort().join("|");

  useEffect(() => {
    if (!socket || !projectId) return undefined;

    // Several components listen to one project; join once, leave after the last
    const counts = (socket.__projectRefs ??= new Map());
    counts.set(projectId, (counts.get(projectId) || 0) + 1);

    // Re-join after every (re)connect, since rooms do not survive a disconnect
    const join = () => socket.emit("project:join", projectId);
    if (socket.connected) join();
    socket.on("connect", join);

    const names = events ? events.split("|") : [];
    const listeners = names.map((name) => {
      const fn = (payload) => {
        // events from other projects can reach the personal room; ignore them
        const pid = payload?.projectId ?? payload?.project;
        if (pid && String(pid) !== String(projectId)) return;
        handlersRef.current[name]?.(payload);
      };
      socket.on(name, fn);
      return [name, fn];
    });

    return () => {
      socket.off("connect", join);
      listeners.forEach(([name, fn]) => socket.off(name, fn));
      const left = (counts.get(projectId) || 1) - 1;
      if (left > 0) counts.set(projectId, left);
      else {
        counts.delete(projectId);
        if (socket.connected) socket.emit("project:leave", projectId);
      }
    };
  }, [socket, projectId, events]);
}
