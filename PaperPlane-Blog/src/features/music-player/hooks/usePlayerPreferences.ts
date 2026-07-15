import {useCallback, useEffect, useState} from "react";

const MOBILE_QUERY = '(max-width: 680px)';
const STORAGE_KEYS = {
    collapsedDesktop: 'musicPlayerCollapsed.desktop',
    collapsedMobile: 'musicPlayerCollapsed.mobile',
    volume: 'musicPlayerVolume'
};

const getIsMobile = () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches;

const readBoolean = (key: string, fallback: boolean) => {
    try {
        const stored = localStorage.getItem(key);
        return stored === null ? fallback : stored === 'true';
    } catch {
        return fallback;
    }
};

const readVolume = () => {
    try {
        const value = Number(localStorage.getItem(STORAGE_KEYS.volume) ?? 0.72);
        return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.72;
    } catch {
        return 0.72;
    }
};

export const usePlayerPreferences = () => {
    const [isMobile, setIsMobile] = useState(getIsMobile);
    const [collapsed, setCollapsedState] = useState(() => {
        const mobile = getIsMobile();
        return readBoolean(mobile ? STORAGE_KEYS.collapsedMobile : STORAGE_KEYS.collapsedDesktop, mobile);
    });
    const [volume, setVolumeState] = useState(readVolume);

    useEffect(() => {
        const mediaQuery = window.matchMedia(MOBILE_QUERY);
        const handleChange = (event: MediaQueryListEvent) => {
            setIsMobile(event.matches);
            setCollapsedState(readBoolean(
                event.matches ? STORAGE_KEYS.collapsedMobile : STORAGE_KEYS.collapsedDesktop,
                event.matches
            ));
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const setCollapsed = useCallback((value: boolean) => {
        setCollapsedState(value);
        try {
            localStorage.setItem(
                isMobile ? STORAGE_KEYS.collapsedMobile : STORAGE_KEYS.collapsedDesktop,
                String(value)
            );
        } catch {
            // Storage can be unavailable in private browsing; UI state remains usable in memory.
        }
    }, [isMobile]);

    const setVolume = useCallback((value: number) => {
        const normalized = Math.min(1, Math.max(0, value));
        setVolumeState(normalized);
        try {
            localStorage.setItem(STORAGE_KEYS.volume, String(normalized));
        } catch {
            // Keep the current session functional when storage is unavailable.
        }
    }, []);

    return {collapsed, setCollapsed, volume, setVolume};
};
