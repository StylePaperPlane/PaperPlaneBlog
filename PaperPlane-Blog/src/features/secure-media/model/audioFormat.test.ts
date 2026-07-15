import {describe, expect, it} from 'vitest';
import {audioFormatLabel, mediaSourceTypeFor} from './audioFormat';

describe('audio format metadata', () => {
    it('maps MP3 and FLAC to explicit browser media types', () => {
        expect(mediaSourceTypeFor('mp3')).toBe('audio/mpeg');
        expect(mediaSourceTypeFor('flac')).toBe('audio/flac');
        expect(audioFormatLabel('flac')).toBe('FLAC');
    });
});
