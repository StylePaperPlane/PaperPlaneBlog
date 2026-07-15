export interface MusicTrack {
    musicKey: number;
    assetId?: string;
    title: string;
    artist?: string;
    audioFormat: 'mp3' | 'flac';
    audioUrl?: string;
    coverUrl: string;
    lyricUrl: string;
    sortOrder: number;
    enabled: boolean;
    createTime?: string;
    updateTime?: string;
    cipherUrl?: string;
    plaintextSize?: number;
    chunkSize?: number;
    chunkCount?: number;
}
