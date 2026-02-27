import { apiClient } from '../../../api/client';

const ADMIN_TOKEN_KEY = 'admin_auth_token';

export const getAdminToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(ADMIN_TOKEN_KEY);
};

export const applyAdminToken = (token: string | null) => {
    if (typeof window === 'undefined') return;
    if (token) {
        window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
        window.localStorage.removeItem(ADMIN_TOKEN_KEY);
        delete apiClient.defaults.headers.common.Authorization;
    }
};

export const initializeAdminSession = (): string | null => {
    const token = getAdminToken();
    if (token) {
        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
    return token;
};
