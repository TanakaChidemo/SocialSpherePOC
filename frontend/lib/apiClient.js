import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// The store starts with a placeholder signed-in user so the UI looks ready
// immediately, but that isn't backed by a real JWT. Lazily exchange it for
// one from the backend's demo endpoint the first time any authenticated
// request goes out, and share the in-flight promise so concurrent requests
// (e.g. loading drafts + generating a caption at once) don't race each
// other into firing duplicate logins or going out unauthenticated.
let authReadyPromise = null;

// Demo tokens are short-lived (JWT_ACCESS_EXPIRY, 15m by default). Pass
// forceRefresh once a request has already come back 401 with an existing
// token, so an expired token gets replaced rather than reused forever.
function ensureAccessToken(forceRefresh = false) {
  if (!forceRefresh) {
    const existing = window.localStorage.getItem("accessToken");
    if (existing) return Promise.resolve(existing);
  }

  if (!authReadyPromise) {
    window.localStorage.removeItem("accessToken");
    authReadyPromise = apiClient
      .post("/auth/demo")
      .then((res) => {
        const token = res.data.accessToken;
        window.localStorage.setItem("accessToken", token);
        return token;
      })
      .catch(() => null)
      .finally(() => {
        authReadyPromise = null;
      });
  }
  return authReadyPromise;
}

apiClient.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const isAuthBootstrap = config.url?.startsWith("/auth/");
    const token = isAuthBootstrap
      ? window.localStorage.getItem("accessToken")
      : await ensureAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If backend is not running, provide graceful structured error
    if (!error.response) {
      return Promise.reject(new Error("Network connection to backend server failed"));
    }

    const config = error.config;
    const isAuthBootstrap = config?.url?.startsWith("/auth/");

    // Stored token expired/invalid: refresh once and replay the request.
    if (error.response.status === 401 && config && !isAuthBootstrap && !config._retried) {
      config._retried = true;
      const token = await ensureAccessToken(true);
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        return apiClient(config);
      }
    }

    return Promise.reject(error);
  }
);

export const api = {
  auth: {
    login: (data) => apiClient.post("/auth/login", data).then((r) => r.data),
    register: (data) => apiClient.post("/auth/register", data).then((r) => r.data),
    demo: () => apiClient.post("/auth/demo").then((r) => r.data),
    me: () => apiClient.get("/auth/me").then((r) => r.data),
  },
  content: {
    list: () => apiClient.get("/content").then((r) => r.data.items || []),
    getById: (id) => apiClient.get(`/content/${id}`).then((r) => r.data),
    create: (data) => apiClient.post("/content", data).then((r) => r.data),
    update: (id, data) => apiClient.put(`/content/${id}`, data).then((r) => r.data),
    delete: (id) => apiClient.delete(`/content/${id}`),
    uploadMedia: (formData) =>
      apiClient.post("/content/media", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data),
  },
  publish: {
    now: (data) => apiClient.post("/publish/now", data).then((r) => r.data),
    getStatus: (id) => apiClient.get(`/publish/status/${id}`).then((r) => r.data),
  },
  socialAccounts: {
    list: () => apiClient.get("/social-accounts").then((r) => r.data.items || []),
    link: (data) => apiClient.post("/social-accounts", data).then((r) => r.data),
    unlink: (id) => apiClient.delete(`/social-accounts/${id}`),
  },
  ai: {
    generateCaption: (data) => apiClient.post("/ai/generate-caption", data).then((r) => r.data),
    suggestHashtags: (data) => apiClient.post("/ai/suggest-hashtags", data).then((r) => r.data),
    repurpose: (data) => apiClient.post("/ai/repurpose", data).then((r) => r.data),
  },
};
