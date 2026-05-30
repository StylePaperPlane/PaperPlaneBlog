/**
 * 图片懒加载组件
 */

import React, { useRef, useEffect, useState } from 'react';
import {resolveImageUrl} from "../../utils/imageUrl.ts";

interface LazyImageProps {
    src: string;
    threshold?: number;
    className?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({ src, threshold = 0.5, className }) => {
    const imgRef = useRef<HTMLSpanElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            if (imgRef.current) {
                observer.unobserve(imgRef.current);
            }
        };
    }, [imgRef, threshold]);

    if (!isVisible) {
        return (
            <span ref={imgRef} className={className ? `${className} lazy-image-shell` : 'lazy-image-shell'}>
                <span className="lazy-image-placeholder" />
            </span>
        );
    }

    return (
        <span ref={imgRef} className={className ? `${className} lazy-image-shell` : 'lazy-image-shell'}>
            <img src={resolveImageUrl(src)} />
        </span>
    );
};

export default LazyImage;
