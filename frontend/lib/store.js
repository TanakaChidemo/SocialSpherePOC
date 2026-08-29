import { create } from "zustand";

export const useAppStore = create((set, get) => ({
  user: {
    id: "11111111-1111-1111-1111-111111111111",
    email: "demo@example.com",
    name: "Tanaka Chidemo",
    role: "admin",
  },
  token: "demo_access_token",
  drafts: [],
  activeDraft: null,
  socialAccounts: [
    { id: "sa_2", platform: "instagram", displayName: "TechPulse Studio (@techpulse.studio)" },
    { id: "sa_4", platform: "facebook", displayName: "TechPulse Global Page" },
  ],
  toasts: [],
  isAuthModalOpen: false,
  isAiModalOpen: false,
  isLoading: false,

  setUser: (user, token) => {
    if (token !== undefined && typeof window !== "undefined") {
      if (token) {
        window.localStorage.setItem("accessToken", token);
      } else {
        window.localStorage.removeItem("accessToken");
      }
    }
    set({ user, token: token !== undefined ? token : get().token });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("accessToken");
    }
    set({ user: null, token: null });
    get().addToast("info", "Signed out successfully");
  },

  setDrafts: (drafts) => set({ drafts }),
  setActiveDraft: (draft) => set({ activeDraft: draft }),
  setSocialAccounts: (accounts) => set({ socialAccounts: accounts }),

  addToast: (type, text) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    set((state) => ({ toasts: [...state.toasts, { id, type, text }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
  setAiModalOpen: (open) => set({ isAiModalOpen: open }),
}));
