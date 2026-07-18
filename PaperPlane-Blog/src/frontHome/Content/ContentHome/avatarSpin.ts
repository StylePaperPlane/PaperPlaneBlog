export type AvatarSpinDirection = 'clockwise' | 'counterclockwise';

export const resolveAvatarSpinDirection = (
    pointerX: number,
    boundsLeft: number,
    boundsWidth: number,
): AvatarSpinDirection => (
    pointerX < boundsLeft + boundsWidth / 2
        ? 'counterclockwise'
        : 'clockwise'
);
