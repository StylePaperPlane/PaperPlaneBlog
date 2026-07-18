import {describe, expect, it} from 'vitest';
import {resolveAvatarSpinDirection} from './avatarSpin';

describe('resolveAvatarSpinDirection', () => {
    it('rotates counterclockwise when the pointer enters from the left', () => {
        expect(resolveAvatarSpinDirection(119, 100, 40)).toBe('counterclockwise');
    });

    it('rotates clockwise when the pointer enters from the right', () => {
        expect(resolveAvatarSpinDirection(121, 100, 40)).toBe('clockwise');
    });
});
