import axios from "axios";
import getToken from "./getToken.tsx"
import deleteToken from "./deleteToken.tsx";

export const httpBaseURL = import.meta.env.VITE_HTTP_BASEURL || '';

const isProtectedRoute = () => window.location.pathname.startsWith('/dashboard');

const redirectToLogin = () => {
    deleteToken();
    if (isProtectedRoute()) {
        window.location.replace('/login');
    }
};

const http = axios.create({
    baseURL: httpBaseURL,
    timeout: 5000
})

// 添加请求拦截器
http.interceptors.request.use(
    function (config) {
        const token = getToken();
        if (token) {
            config.headers.Authorization = token;
        }
        return config;
    },
    function (error) {
        return Promise.reject(error);
    }
);

http.interceptors.response.use(
    response => response,
    error => {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
            redirectToLogin();
        }
        return Promise.reject(error);
    }
);


export default http
