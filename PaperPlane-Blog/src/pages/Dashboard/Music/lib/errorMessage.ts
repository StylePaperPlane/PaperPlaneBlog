import axios from "axios";

interface ErrorResponse {
    message?: string;
}

export const getMusicRequestErrorMessage = (error: unknown, fallback: string) => {
    if (!axios.isAxiosError<ErrorResponse>(error)) return fallback;
    if (error.code === 'ECONNABORTED') return '上传超时，请检查网络后重试';

    const status = error.response?.status;
    if (status === 401 || status === 403) return '登录已过期，请重新登录';
    if (status === 413) return '音乐压缩包不能超过 100MB';

    const serverMessage = error.response?.data?.message;
    return serverMessage?.trim() || fallback;
};
