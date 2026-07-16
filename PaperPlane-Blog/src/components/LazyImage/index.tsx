/**
 * 图片懒加载组件
 */

import React, { useRef, useEffect, useState } from 'react';
import {resolveImageUrl} from "../../utils/imageUrl.ts";

interface LazyImageProps {
    src: string;
    threshold?: number;
    rootMargin?: string;
    className?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({
    src,
    threshold = 0.01,
    rootMargin = '320px 0px',
    className,
}) => {
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
                threshold,
                rootMargin,
            }
        );

        const currentNode = imgRef.current;
        if (currentNode) {
            observer.observe(currentNode);
        }

        return () => {
            if (currentNode) {
                observer.unobserve(currentNode);
            }
        };
    }, [rootMargin, threshold]);

    if (!isVisible) {
        return (
            <span ref={imgRef} className={className ? `${className} lazy-image-shell` : 'lazy-image-shell'}>
                <span className="lazy-image-placeholder" />
            </span>
        );
    }

    return (
        <span ref={imgRef} className={className ? `${className} lazy-image-shell` : 'lazy-image-shell'}>
            <img src={resolveImageUrl(src)} alt="" loading="eager" decoding="async" />
        </span>
    );
};

export default LazyImage;
