export type AudioFormat = 'mp3' | 'flac';

const MEDIA_SOURCE_TYPES: Record<AudioFormat, string> = {
    mp3: 'audio/mpeg',
    flac: 'audio/flac',
};

export const mediaSourceTypeFor = (format: AudioFormat): string => MEDIA_SOURCE_TYPES[format];

export const audioFormatLabel = (format: AudioFormat): string => format.toUpperCase();
