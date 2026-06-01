import './index.sass';
import {Button, Form, Image, Input, InputNumber, message, Modal, Space, Switch, Table, Upload} from "antd";
import type {TableProps, UploadProps} from "antd";
import {InboxOutlined, PlusOutlined} from "@ant-design/icons";
import axios from "axios";
import {useEffect, useState} from "react";
import {MusicTrack} from "../../../interface/MusicType";
import {deleteMusic, getMusicList, updateMusic, uploadMusic} from "../../../apis/MusicMethods";
import {resolveMusicUrl} from "../../../utils/musicUrl";

const {Dragger} = Upload;

const Music = () => {
    const [tracks, setTracks] = useState<MusicTrack[]>([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingTrack, setEditingTrack] = useState<MusicTrack | null>(null);
    const [uploading, setUploading] = useState(false);
    const [form] = Form.useForm();
    const [editForm] = Form.useForm();

    useEffect(() => {
        initMusicList();
    }, []);

    const initMusicList = () => {
        getMusicList().then(res => {
            setTracks(res.data.data || []);
        }).catch(error => {
            if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
                message.error('登录已过期，请重新登录');
                return;
            }
            message.error('获取音乐列表失败');
        });
    };

    const uploadMusicRequest: UploadProps['customRequest'] = async ({file}) => {
        if (!(file instanceof File)) {
            message.error('上传失败，请确认zip内包含mp3、lrc和封面');
            return;
        }

        try {
            setUploading(true);
            const values = form.getFieldsValue();
            const formData = new FormData();
            formData.append('file', file);
            if (values.title) formData.append('title', values.title);
            if (values.artist) formData.append('artist', values.artist);
            if (values.sortOrder !== undefined && values.sortOrder !== null) formData.append('sortOrder', String(values.sortOrder));
            await uploadMusic(formData);
            message.success('上传成功');
            form.resetFields();
            setUploadOpen(false);
            initMusicList();
        } catch (error) {
            message.error('上传失败，请确认zip内包含mp3、lrc和封面');
        } finally {
            setUploading(false);
        }
    };

    const uploadProps: UploadProps = {
        name: 'file',
        accept: '.zip',
        multiple: false,
        showUploadList: false,
        customRequest: uploadMusicRequest
    };

    const openEdit = (track: MusicTrack) => {
        setEditingTrack(track);
        editForm.setFieldsValue(track);
        setEditOpen(true);
    };

    const saveEdit = async () => {
        if (!editingTrack) return;
        const values = await editForm.validateFields();
        await updateMusic(editingTrack.musicKey, values);
        message.success('保存成功');
        setEditOpen(false);
        setEditingTrack(null);
        initMusicList();
    };

    const deleteSelected = async () => {
        if (!selectedRowKeys.length) {
            message.warning('请先选择歌曲');
            return;
        }
        await deleteMusic(selectedRowKeys as number[]);
        message.success('删除成功');
        setSelectedRowKeys([]);
        initMusicList();
    };

    const columns: TableProps<MusicTrack>['columns'] = [
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
                    <span>{track.artist || 'Unknown Artist'}</span>
                </div>
            )
        },
        {
            title: '排序',
            dataIndex: 'sortOrder',
            width: 90
        },
        {
            title: '启用',
            dataIndex: 'enabled',
            width: 90,
            render: (_, track) => (
                <Switch
                    checked={track.enabled}
                    onChange={checked => updateMusic(track.musicKey, {enabled: checked}).then(initMusicList)}
                />
            )
        },
        {
            title: '操作',
            width: 120,
            render: (_, track) => <Button type="link" onClick={() => openEdit(track)}>编辑</Button>
        }
    ];

    return (
        <div className="music-admin allin">
            <div className="music-admin-toolbar">
                <div>
                    <h2>音乐管理</h2>
                    <p>共 {tracks.length} 首歌曲，已选 {selectedRowKeys.length} 首</p>
                </div>
                <Space>
                    <Button danger disabled={!selectedRowKeys.length} onClick={deleteSelected}>删除</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadOpen(true)}>上传音乐</Button>
                </Space>
            </div>

            <Table
                rowKey="musicKey"
                columns={columns}
                dataSource={tracks}
                pagination={{pageSize: 8, showSizeChanger: false}}
                rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys
                }}
            />

            <Modal title="上传音乐zip" open={uploadOpen} onCancel={() => setUploadOpen(false)} footer={null}>
                <Form form={form} layout="vertical">
                    <Form.Item label="标题" name="title">
                        <Input placeholder="不填则使用mp3文件名" />
                    </Form.Item>
                    <Form.Item label="歌手" name="artist">
                        <Input />
                    </Form.Item>
                    <Form.Item label="排序" name="sortOrder">
                        <InputNumber style={{width: '100%'}} min={0} />
                    </Form.Item>
                </Form>
                <Dragger {...uploadProps} disabled={uploading}>
                    <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                    <p className="ant-upload-text">点击或拖动 zip 到此区域上传</p>
                    <p className="ant-upload-hint">zip 内必须包含 mp3、lrc 和 jpg/png/webp 封面</p>
                </Dragger>
            </Modal>

            <Modal title="编辑音乐" open={editOpen} onOk={saveEdit} onCancel={() => setEditOpen(false)} okText="保存" cancelText="取消">
                <Form form={editForm} layout="vertical">
                    <Form.Item label="标题" name="title" rules={[{required: true, message: '请输入标题'}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="歌手" name="artist">
                        <Input />
                    </Form.Item>
                    <Form.Item label="排序" name="sortOrder">
                        <InputNumber style={{width: '100%'}} min={0} />
                    </Form.Item>
                    <Form.Item label="启用" name="enabled" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Music;
