import axios from 'axios';

const API_URL = 'https://notes-server-3-fej1.onrender.com/api'; // ✅ FIXED

export const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});