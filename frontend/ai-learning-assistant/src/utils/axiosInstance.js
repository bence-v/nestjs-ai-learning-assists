import axios from "axios";
import {BASE_URL} from "./apiPath.js";

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 80000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

// Request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("token");
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for axiosInstance
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if(error.response) {
            // Check for 401 Unauthorized
            if(error.response.status === 401) {
                console.error("Unauthorized! Token may be expired or invalid.");
                // Clear storage and redirect to login
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                // Avoid infinite redirect loops if already on login page
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            } else if(error.response.status === 500) {
                console.error("Server error. Please try again later.");
            }
        } else if(error.code === "ECONNABORTED") {
            console.error("Request timeout. Please try again.");
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
