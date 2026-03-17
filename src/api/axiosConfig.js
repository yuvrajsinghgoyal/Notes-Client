import axios from 'axios';
import CryptoJS from 'crypto-js';

const API_URL = 'https://notes-server-3-fej1.onrender.com/api';
const AES_SECRET = 'supersecretencryptionkey_12345';

// ✅ axios instance
export const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

// ✅ encrypt helper
const encryptObj = (dataObj) => {
    return CryptoJS.AES.encrypt(JSON.stringify(dataObj), AES_SECRET).toString();
};

// ✅ EXPORT THIS PROPERLY
export function setCryptoInterceptor() {
    axiosInstance.interceptors.request.use(
        (config) => {
            if (config.data && config.encryptPayload) {
                config.data = { payload: encryptObj(config.data) };
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    axiosInstance.interceptors.response.use(
        (response) => {
            if (response.data && response.data.payload) {
                try {
                    const bytes = CryptoJS.AES.decrypt(response.data.payload, AES_SECRET);
                    response.data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                } catch (err) {
                    console.error('Decrypt error', err);
                }
            }
            return response;
        },
        (error) => Promise.reject(error)
    );
}