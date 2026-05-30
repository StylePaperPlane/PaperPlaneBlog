import {httpBaseURL} from "../apis/axios.tsx";

export const resolveImageUrl = (url?: string | null) => {
    if (!url) {
        return '';
    }

    if (/^(https?:)?\/\//.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
        return url;
    }

    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    const normalizedBaseURL = httpBaseURL.replace(/\/$/, '');

    return `${normalizedBaseURL}${normalizedUrl}`;
};
