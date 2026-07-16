import type {components} from '../../../../features/secure-media/api/schema';

export type AdminPlaylist = components['schemas']['AdminPlaylist'];

export const moveTrack = (trackIds: number[], index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (index < 0 || target < 0 || target >= trackIds.length) return trackIds;
    const next = [...trackIds];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
};
