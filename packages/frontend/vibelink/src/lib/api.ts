import axios from "axios";

const API_BASE = "http://localhost:4000";

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  register: (data: { email: string; password: string; age: number }) =>
    api.post("/api/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/api/auth/login", data),
};

export const streams = {
  getAll: () => api.get("/api/livefeeds"),
  create: (title: string) => api.post("/api/livefeeds", { title }),
  end: (id: number) => api.post(`/api/livefeeds/${id}/end`),
};

export const messages = {
  get: (streamId: number) => api.get(`/api/messages/${streamId}`),
  send: (streamId: number, text: string) =>
    api.post(`/api/messages/${streamId}`, { text }),
};
