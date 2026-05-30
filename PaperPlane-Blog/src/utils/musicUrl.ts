import {httpBaseURL} from "../apis/axios";

const isAbsoluteUrl = (url?: string) => !!url && /^(https?:)?\/\//i.test(url);

function resolveMusicUrl(url?: string) {
    if (!url) return '';
    if (isAbsoluteUrl(url)) return url;
    if (url.startsWith('/music/')) return url;
    const normalized = url.startsWith('/') ? url : `/${url}`;
    return `${httpBaseURL}${normalized}`;
}

export {resolveMusicUrl};
