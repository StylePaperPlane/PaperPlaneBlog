import axios from 'axios';
import getToken from '../../../apis/getToken';
import {mediaBaseUrl} from './client';

export const mediaHttp = axios.create({
    baseURL: mediaBaseUrl,
    timeout: 5000,
    withCredentials: true,
});

mediaHttp.interceptors.request.use(config => {
    const token = getToken();
    if (token) config.headers.Authorization = token;
    return config;
});
