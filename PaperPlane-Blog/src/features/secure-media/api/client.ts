import createClient from 'openapi-fetch';
import type {paths} from './schema';

export const mediaBaseUrl = import.meta.env.VITE_MEDIA_BASE_URL?.trim()
    || (import.meta.env.DEV ? 'http://127.0.0.1:8090' : 'https://media.paperplane.codes');

export const mediaClient = createClient<paths>({baseUrl: mediaBaseUrl, credentials: 'include'});
