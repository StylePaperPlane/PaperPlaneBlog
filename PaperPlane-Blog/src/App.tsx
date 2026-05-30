import Head from  './frontHome/Head';
import { Outlet, useLocation } from "react-router-dom";
import './frontHome/main.css';
import { useEffect, useRef, useState } from "react";
import './App.sass';
import BottomMenu from "./components/BottomMenu";
import ElasticUnderlay from "./components/ElasticUnderlay";

const MAX_BOTTOM_OVERSCROLL = 96;
const BOTTOM_RELEASE_MS = 520;

function App() {
    const [isDark, setDark] = useState(false);
    const [scrollHeight, setScrollHeight] = useState(0);
    const [bottomOverscroll, setBottomOverscroll] = useState(0);
    const [isBottomReleasing, setBottomReleasing] = useState(false);
    const bottomOverscrollRef = useRef(0);
    const bottomReleaseTimerRef = useRef<number>();
    const bottomReleaseEndTimerRef = useRef<number>();
    const touchYRef = useRef<number | null>(null);
    const location = useLocation();
    const isFriendsRoute = location.pathname === '/friends';
    const scrollSurfaceClassName = [
        isFriendsRoute ? 'frontFriendSurface' : 'frontScrollSurface',
        isBottomReleasing ? (isFriendsRoute ? 'frontFriendSurfaceReleasing' : 'frontScrollSurfaceReleasing') : ''
    ].filter(Boolean).join(' ');

    useEffect(() => {
        setDark(localStorage.getItem('isDarkMode') === 'true');
        const handleScroll = () => {
            const currentScrollHeight = window.scrollY || document.documentElement.scrollTop;
            setScrollHeight(currentScrollHeight);
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        const preventContextMenu = (event: MouseEvent) => {
            event.preventDefault();
        };

        document.addEventListener('contextmenu', preventContextMenu);
        return () => {
            document.removeEventListener('contextmenu', preventContextMenu);
        };
    }, []);

    useEffect(() => {
        const clampOverscroll = (value: number) => Math.max(0, Math.min(MAX_BOTTOM_OVERSCROLL, value));
        const updateBottomOverscroll = (value: number) => {
            const next = clampOverscroll(value);
            bottomOverscrollRef.current = next;
            setBottomOverscroll(next);
        };
        const isAtPageBottom = () => {
            const scrollingElement = document.scrollingElement || document.documentElement;
            return window.scrollY + window.innerHeight >= scrollingElement.scrollHeight - 2;
        };
        const clearReleaseTimers = () => {
            window.clearTimeout(bottomReleaseTimerRef.current);
            window.clearTimeout(bottomReleaseEndTimerRef.current);
        };
        const releaseBottomOverscroll = (delay = 120) => {
            clearReleaseTimers();
            bottomReleaseTimerRef.current = window.setTimeout(() => {
                if (bottomOverscrollRef.current <= 0) return;
                setBottomReleasing(true);
                updateBottomOverscroll(0);
                bottomReleaseEndTimerRef.current = window.setTimeout(() => {
                    setBottomReleasing(false);
                }, BOTTOM_RELEASE_MS);
            }, delay);
        };
        const pullBottom = (delta: number) => {
            const current = bottomOverscrollRef.current;
            const resistance = delta > 0
                ? 0.24 * Math.max(0.18, 1 - current / MAX_BOTTOM_OVERSCROLL)
                : 0.56;

            updateBottomOverscroll(current + delta * resistance);
        };
        const handleWheel = (event: WheelEvent) => {
            const shouldPull = bottomOverscrollRef.current > 0 || (isAtPageBottom() && event.deltaY > 0);
            if (!shouldPull) return;

            event.preventDefault();
            setBottomReleasing(false);
            clearReleaseTimers();
            pullBottom(event.deltaY);
            releaseBottomOverscroll();
        };
        const handleTouchStart = (event: TouchEvent) => {
            touchYRef.current = event.touches[0]?.clientY ?? null;
        };
        const handleTouchMove = (event: TouchEvent) => {
            if (touchYRef.current === null) return;

            const currentY = event.touches[0]?.clientY ?? touchYRef.current;
            const delta = touchYRef.current - currentY;
            const shouldPull = bottomOverscrollRef.current > 0 || (isAtPageBottom() && delta > 0);

            if (!shouldPull) {
                touchYRef.current = currentY;
                return;
            }

            event.preventDefault();
            setBottomReleasing(false);
            clearReleaseTimers();
            pullBottom(delta);
            touchYRef.current = currentY;
        };
        const handleTouchEnd = () => {
            touchYRef.current = null;
            releaseBottomOverscroll(0);
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('touchcancel', handleTouchEnd);

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('touchcancel', handleTouchEnd);
            clearReleaseTimers();
        };
    }, []);

    return (
        <div className={isDark ? 'frontDark frontRoot' : 'frontRoot'}>
            <Head setDark={setDark} isDark={isDark} scrollHeight={scrollHeight}/>
            <ElasticUnderlay />
            <div
                className={scrollSurfaceClassName}
                style={bottomOverscroll > 0 ? {transform: `translateY(${-bottomOverscroll}px)`} : undefined}
            >
                <Outlet />
            </div>
            <BottomMenu scrollHeight={scrollHeight} isDark={isDark} setDark={setDark}/>
        </div>
    );
}

export default App;
