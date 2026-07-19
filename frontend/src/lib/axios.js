import axios from 'axios';

export const API_BASE_URL = import.meta.env.MODE === "development"
    ? import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    : import.meta.env.VITE_API_URL || "/api";

export const SOCKET_URL = import.meta.env.MODE === "development"
    ? import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
    : import.meta.env.VITE_BACKEND_URL || undefined;

export const Axiosinstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
});
