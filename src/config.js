// Server Url:
export const SERVER_URL_RENDER =
  import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

export const SERVER_URL_LOCAL =
  import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

  // Local Server Url:
export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || "https://webrtc-basic2-2.onrender.com";
  // import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

// Ice servers:
export const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];
