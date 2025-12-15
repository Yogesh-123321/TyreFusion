import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:5000/api",
});

export const requestOtp = (email) =>
  API.post("/auth/request-otp", { email });

export const verifyOtp = (email, otp) =>
  API.post("/auth/verify-otp", { email, otp });
