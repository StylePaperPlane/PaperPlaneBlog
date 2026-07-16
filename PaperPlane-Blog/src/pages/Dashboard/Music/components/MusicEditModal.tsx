import {Form, Input, InputNumber, Modal, Switch} from "antd";
import {useEffect} from "react";
import type {MusicTrack} from "../../../../interface/MusicType";

interface MusicEditModalProps {
    track: MusicTrack | null;
    saving: boolean;
    onClose: () => void;
    onSave: (values: Partial<MusicTrack>) => Promise<void>;
}

const MusicEditModal = ({track, saving, onClose, onSave}: MusicEditModalProps) => {
    const [form] = Form.useForm<Partial<MusicTrack>>();

    useEffect(() => {
        if (track) form.setFieldsValue(track);
        else form.resetFields();
    }, [form, track]);

    const save = async () => {
        const values = await form.validateFields();
        await onSave(values);
    };

    return (
        <Modal
            title="编辑音乐"
            open={Boolean(track)}
            onOk={() => void save()}
            onCancel={onClose}
            okText="保存"
            cancelText="取消"
            confirmLoading={saving}
            maskClosable={!saving}
            forceRender
        >
            <Form form={form} layout="vertical">
                <Form.Item label="标题" name="title" rules={[{required: true, message: '请输入标题'}]}>
                    <Input maxLength={100} />
                </Form.Item>
                <Form.Item label="歌手" name="artist">
                    <Input maxLength={100} />
                </Form.Item>
                <Form.Item label="排序" name="sortOrder">
                    <InputNumber style={{width: '100%'}} min={0} />
                </Form.Item>
                <Form.Item label="启用" name="enabled" valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default MusicEditModal;
