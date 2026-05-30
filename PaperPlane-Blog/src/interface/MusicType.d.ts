export interface MusicTrack {
    musicKey: number;
    title: string;
    artist?: string;
    audioUrl: string;
    coverUrl: string;
    lyricUrl: string;
    sortOrder: number;
    enabled: boolean;
    createTime?: string;
    updateTime?: string;
}
