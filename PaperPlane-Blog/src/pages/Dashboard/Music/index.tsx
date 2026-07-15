import './index.sass';
import {Button, Image, Space, Switch, Table, message} from "antd";
import type {TableProps} from "antd";
import {PlusOutlined} from "@ant-design/icons";
import {useMemo, useState} from "react";
import type {MusicTrack} from "../../../interface/MusicType";
import {resolveMusicUrl} from "../../../utils/musicUrl";
import MusicEditModal from "./components/MusicEditModal";
import MusicUploadModal from "./components/MusicUploadModal";
import {useMusicAdmin} from "./hooks/useMusicAdmin";

const Music = () => {
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [editingTrack, setEditingTrack] = useState<MusicTrack | null>(null);
    const [saving, setSaving] = useState(false);
    const admin = useMusicAdmin();

    const deleteSelected = async () => {
        if (!selectedRowKeys.length) {
            message.warning('请先选择歌曲');
            return;
        }
        await admin.deleteTracks(selectedRowKeys as number[]);
        setSelectedRowKeys([]);
    };

    const saveEdit = async (values: Partial<MusicTrack>) => {
        if (!editingTrack) return;
        setSaving(true);
        try {
            await admin.saveTrack(editingTrack, values);
            setEditingTrack(null);
        } finally {
            setSaving(false);
        }
    };

    const columns = useMemo<TableProps<MusicTrack>['columns']>(() => [
        {
            title: '封面',
            dataIndex: 'coverUrl',
            width: 88,
            render: coverUrl => <Image src={resolveMusicUrl(coverUrl)} width={52} height={52} style={{objectFit: 'cover', borderRadius: 8}} />
        },
        {
            title: '歌曲',
            dataIndex: 'title',
            render: (_, track) => (
                <div className="music-admin-title">
                    <strong>{track.title}</strong>
                    <span>{track.artist || '未知歌手'}</span>
                </div>
            )
        },
        {
            title: '格式',
            dataIndex: 'audioFormat',
            width: 80,
            render: format => <span className="music-admin-format">{String(format).toUpperCase()}</span>
        },
        {title: '排序', dataIndex: 'sortOrder', width: 90},
        {
            title: '启用',
            dataIndex: 'enabled',
            width: 90,
            render: (_, track) => (
                <Switch
                    checked={track.enabled}
                    onChange={checked => void admin.setTrackEnabled(track, checked)}
                    aria-label={`${track.title} 启用状态`}
                />
            )
        },
        {
            title: '操作',
            width: 120,
            render: (_, track) => <Button type="link" onClick={() => setEditingTrack(track)}>编辑</Button>
        }
    ], [admin]);

    return (
        <div className="music-admin allin">
            <div className="music-admin-toolbar">
                <div>
                    <h2>音乐管理</h2>
                    <p>共 {admin.tracks.length} 首歌曲，已选 {selectedRowKeys.length} 首</p>
                </div>
                <Space>
                    <Button danger disabled={!selectedRowKeys.length} onClick={() => void deleteSelected()}>删除</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadOpen(true)}>上传音乐</Button>
                </Space>
            </div>

            <Table
                rowKey="musicKey"
                columns={columns}
                dataSource={admin.tracks}
                loading={admin.loading}
                pagination={{pageSize: 8, showSizeChanger: false}}
                rowSelection={{selectedRowKeys, onChange: setSelectedRowKeys}}
            />

            <MusicUploadModal
                open={uploadOpen}
                uploading={admin.uploading}
                progress={admin.uploadProgress}
                onClose={() => setUploadOpen(false)}
                onUpload={admin.uploadTrack}
            />
            <MusicEditModal
                track={editingTrack}
                saving={saving}
                onClose={() => setEditingTrack(null)}
                onSave={saveEdit}
            />
        </div>
    );
};

export default Music;
