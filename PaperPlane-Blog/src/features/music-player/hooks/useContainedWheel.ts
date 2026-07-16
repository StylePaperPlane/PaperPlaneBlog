import {useEffect, useRef} from 'react';
import {shouldContainWheel} from '../lib/wheelBoundary';

export const useContainedWheel = <T extends HTMLElement>() => {
    const ref = useRef<T>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const containWheel = (event: WheelEvent) => {
            event.stopPropagation();
            if (shouldContainWheel(element, event.deltaY)) event.preventDefault();
        };

        element.addEventListener('wheel', containWheel, {passive: false});
        return () => element.removeEventListener('wheel', containWheel);
    }, []);

    return ref;
};
