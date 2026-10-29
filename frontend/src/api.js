import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  withCredentials: true,
});

// On 401, try one refresh-token call, then replay the original request
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const url = original?.url || "";
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !url.includes("/auth/refresh-token") &&
      !url.includes("/auth/login")
    ) {
      original._retry = true;
      try {
        refreshing ??= api.post("/auth/refresh-token");
        await refreshing;
        return api(original);
      } catch {
        // fall through
      } finally {
        refreshing = null;
      }
    }
    return Promise.reject(error);
  },
);

// Backend wraps everything in { statusCode, message, data, success }
export const unwrap = (res) => res.data?.data;

export const errMsg = (e) =>
  e.response?.data?.errors?.[0]?.msg ||
  e.response?.data?.errors?.[0]?.message ||
  e.response?.data?.message ||
  e.message ||
  "Something went wrong";

export const ROLES = { ADMIN: "admin", PROJECT_ADMIN: "project_admin", MEMBER: "member" };
export const STATUSES = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];
