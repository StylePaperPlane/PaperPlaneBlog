import {describe, expect, it} from 'vitest';
import {resolveImageUrl} from './imageUrl';

describe('resolveImageUrl', () => {
    it('anchors stored upload references at the site root', () => {
        expect(resolveImageUrl('uploads/avatar.jpg', '')).toBe('/uploads/avatar.jpg');
        expect(resolveImageUrl('/uploads/avatar.jpg', '')).toBe('/uploads/avatar.jpg');
    });

    it('uses the configured API origin during local development', () => {
        expect(resolveImageUrl('uploads/avatar.jpg', 'http://127.0.0.1:8091/'))
            .toBe('http://127.0.0.1:8091/uploads/avatar.jpg');
    });

    it('does not rewrite remote or browser-owned image sources', () => {
        expect(resolveImageUrl('https://cdn.example/avatar.jpg', '')).toBe('https://cdn.example/avatar.jpg');
        expect(resolveImageUrl('data:image/png;base64,AA==', '')).toBe('data:image/png;base64,AA==');
        expect(resolveImageUrl('blob:https://blog.example/id', '')).toBe('blob:https://blog.example/id');
    });
});
