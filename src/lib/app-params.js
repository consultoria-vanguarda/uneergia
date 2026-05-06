export const appParams = {
  platform: "supabase",
  appBaseUrl: import.meta.env.VITE_APP_BASE_URL || (typeof window !== "undefined" ? window.location.origin : ""),
  functionsVersion: "v1"
};
