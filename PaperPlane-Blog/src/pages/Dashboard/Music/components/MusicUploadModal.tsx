import {Form, Input, InputNumber, Modal, Progress, Upload, message} from "antd";
import type {UploadProps} from "antd";
import {InboxOutlined} from "@ant-design/icons";
import type {MusicUploadValues} from "../hooks/useMusicAdmin";

const {Dragger} = Upload;
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

interface MusicUploadModalProps {
    open: boolean;
    uploading: boolean;
    progress: number;
    onClose: () => void;
    onUpload: (file: File, values: MusicUploadValues) => Promise<void>;
}

const MusicUploadModal = ({open, uploading, progress, onClose, onUpload}: MusicUploadModalProps) => {
    const [form] = Form.useForm<MusicUploadValues>();

    const uploadProps: UploadProps = {
        name: 'file',
        accept: '.zip,application/zip',
        multiple: false,
        showUploadList: false,
        disabled: uploading,
        beforeUpload: file => {
            if (!file.name.toLowerCase().endsWith('.zip')) {
                message.error('请选择 ZIP 格式的音乐压缩包');
                return Upload.LIST_IGNORE;
            }
            if (file.size > MAX_UPLOAD_BYTES) {
                message.error('音乐压缩包不能超过 100MB');
                return Upload.LIST_IGNORE;
            }
            return true;
        },
        customRequest: async options => {
            const file = options.file;
            if (!(file instanceof File)) {
                const error = new Error('请选择有效的音乐压缩包');
                message.error(error.message);
                options.onError?.(error);
                return;
            }

            try {
                const values = await form.validateFields();
                await onUpload(file, values);
                options.onSuccess?.({});
                form.resetFields();
                onClose();
            } catch (error) {
                options.onError?.(error instanceof Error ? error : new Error('上传失败'));
            }
        }
    };

    const close = () => {
        if (uploading) return;
        form.resetFields();
        onClose();
    };

    return (
        <Modal title="上传音乐 ZIP" open={open} onCancel={close} footer={null} maskClosable={!uploading} closable={!uploading}>
            <Form form={form} layout="vertical">
                <Form.Item label="标题" name="title">
                    <Input placeholder="不填则使用音频文件名" maxLength={100} />
                </Form.Item>
                <Form.Item label="歌手" name="artist">
                    <Input maxLength={100} />
                </Form.Item>
                <Form.Item label="排序" name="sortOrder">
                    <InputNumber style={{width: '100%'}} min={0} />
                </Form.Item>
            </Form>
            <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                <p className="ant-upload-text">点击或拖动 ZIP 到此区域上传</p>
                <p className="ant-upload-hint">必须包含 1 个 MP3 或 FLAC、1 个 LRC 和 1 张 JPG、PNG 或 WebP 封面，最大 100MB</p>
            </Dragger>
            {uploading && <Progress className="music-upload-progress" percent={progress} status="active" aria-label="音乐上传进度" />}
        </Modal>
    );
};

export default MusicUploadModal;
