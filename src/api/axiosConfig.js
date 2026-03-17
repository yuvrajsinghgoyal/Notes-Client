import axios from 'axios';
import CryptoJS from 'crypto-js';

const API_URL = 'https://notes-server-3-fej1.onrender.com';
const AES_SECRET = 'supersecretencryptionkey_12345'; // Must match backend `.env`

// Shared Axios instance
export const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Crucial for HTTP-only cookies
});

// Helper to encrypt body data
export const encryptObj = (dataObj) => {
    return CryptoJS.AES.encrypt(JSON.stringify(dataObj), AES_SECRET).toString();
};

export const setCryptoInterceptor = () => {
    axiosInstance.interceptors.request.use(
        (config) => {
            // If there's a body that should be encrypted
            if (config.data && config.encryptPayload) {
                config.data = { payload: encryptObj(config.data) };
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    axiosInstance.interceptors.response.use(
        (response) => {
            // Decrypt responses containing `{ payload: ... }`
            if (response.data && response.data.payload) {
                try {
                    const bytes = CryptoJS.AES.decrypt(response.data.payload, AES_SECRET);
                    response.data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                } catch (err) {
                    console.error('Failed to decrypt response payload', err);
                }
            }
            return response;
        },
        (error) => {
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('userInfo');
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }
    );
};
