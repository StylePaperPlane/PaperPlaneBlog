import InfiniteScroll from 'react-infinite-scroll-component';
import './index.sass'
import { Button, Card, Form, Input, Modal, Select, Space, UploadFile} from "antd";
import DeleteButton from "../../../components/Buttons/DeleteButton";
import UpLoadButton from "../../../components/Buttons/UpLoadButton";
import {useCallback, useEffect, useState} from "react";
import { FolderAddOutlined, FolderOpenOutlined, InboxOutlined, SwapOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { message, Upload } from 'antd';
import CheckButton from "../../../components/Buttons/CheckButton";
import {ImageFolder, ImgUrl} from "../../../interface/ImgTypes";
import {
    createImageFolder,
    delImages,
    getImageFolders,
    getImageList,
    moveImagesToFolder,
    uploadImages
} from "../../../apis/ImageMethods.tsx";
import ImageCompression from "../../../apis/ImageCompression.tsx";
import {resolveImageUrl} from "../../../utils/imageUrl.ts";

const DEFAULT_FOLDER = '默认文件夹';

const Albums = () => {
    //状态变量区
    const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
    const [SelectDelete,setSelectDelete] = useState(0)
    const [checkStatus, setCheckStatus] = useState<Record<string, boolean>>({});
    const [staticDate, setStaticDate] = useState<ImgUrl[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModaldelOpen, setIsDelModalOpen] = useState(false);
    const [lastUploadUrl, setLastUploadUrl] = useState('');
    const [folders, setFolders] = useState<ImageFolder[]>([]);
    const [currentFolder, setCurrentFolder] = useState(DEFAULT_FOLDER);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [moveTargetFolder, setMoveTargetFolder] = useState(DEFAULT_FOLDER);
    const [folderForm] = Form.useForm<{ folderName: string }>();


    // 获取图片列表
    const initImageList = useCallback(() => {
        getImageList(currentFolder).then((res) => {
            setStaticDate(res.data.data)
        }).catch((error) => {
            throw error
        })
    }, [currentFolder])

    const initFolders = useCallback(() => {
        getImageFolders().then((res) => {
            const folderList = res.data.data as ImageFolder[];
            setFolders(folderList);
            if (!folderList.some(item => item.folderName === currentFolder)) {
                setCurrentFolder(DEFAULT_FOLDER);
            }
        }).catch((error) => {
            message.error('获取文件夹失败：' + error);
        })
    }, [currentFolder])

    useEffect(() => {
        initFolders()
        initImageList()
    },[initFolders, initImageList])

    //回调函数区域
    const fetchData = async () => {

    };

    const Delete = useCallback(() => {
        //拿出所有的键
        const keysToDelete = Object.keys(checkStatus).filter(key => checkStatus[key]);

        delImages(keysToDelete).then((res) => {
            if(res.status === 200){
                initImageList()
                initFolders()
                message.success("删除成功");
                // 删除完毕后清空 checkStatus
                setCheckStatus({});
                setSelectDelete(0);
            }
        }).catch((error) => {
            message.error("删除失败：" + error)
            // 删除完毕后清空 checkStatus
            setCheckStatus({});
            setSelectDelete(0);
        })
    }, [checkStatus, initFolders, initImageList]);

    // 触发选择框和图片点击
    const handleItemClick = (img: ImgUrl) => {
        // 检查当前图片对应的复选框状态
        const isChecked = checkStatus[img.imageUrl] || false;

        // 更新复选框状态
        setCheckStatus(prevState => ({
            ...prevState,
            [img.imageUrl]: !isChecked // 切换复选框状态
        }));

        // 更新选择的数量
        setSelectDelete(prevCount => isChecked ? prevCount - 1 : prevCount + 1);
    };
    //上传悬浮框
    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = () => {
        setUploadedFiles([])
        setLastUploadUrl('')
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setUploadedFiles([])
        setLastUploadUrl('')
        setIsModalOpen(false);
    };

    const showFolderModal = () => {
        folderForm.resetFields();
        setIsFolderModalOpen(true);
    };

    const handleCreateFolder = async () => {
        const values = await folderForm.validateFields();
        const folderName = values.folderName.trim();
        await createImageFolder(folderName);
        message.success('文件夹创建成功');
        setCurrentFolder(folderName);
        setIsFolderModalOpen(false);
        initFolders();
    };

    const showMoveModal = () => {
        if (SelectDelete === 0) {
            message.warning("待选中")
            return
        }

        setMoveTargetFolder(currentFolder);
        setIsMoveModalOpen(true);
    };

    const handleMoveImages = async () => {
        const keysToMove = Object.keys(checkStatus).filter(key => checkStatus[key]);
        await moveImagesToFolder(keysToMove, moveTargetFolder);
        message.success('移动成功');
        setCheckStatus({});
        setSelectDelete(0);
        setIsMoveModalOpen(false);
        initImageList();
        initFolders();
    };

    const copyUploadUrl = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            message.success('链接已复制');
        } catch (error) {
            message.error('复制失败');
        }
    };

    //推拽上传
    const { Dragger } = Upload;
    const uploadImagesRequest: UploadProps['customRequest'] = async ({file}) => {
        if (!(file instanceof File)) {
            message.error('上传失败：无效文件');
            return;
        }

        const compressedFile = await ImageCompression(file);
        const formData = new FormData();
        formData.append('file', compressedFile);
        formData.append('folderName', currentFolder);
        uploadImages(formData).then((res) => {
            if (res.status === 200) {
                const uploadUrl = res.data.data;
                setLastUploadUrl(uploadUrl);
                initImageList();
                initFolders();
                message.success(`${file.name} 图片上传成功：${uploadUrl}`);
            }
        }).catch((error) => {
            message.error('上传失败' + error);
        });
    };

    const props: UploadProps = {
        name: 'file',
        fileList: uploadedFiles,
        multiple: true,
        customRequest: uploadImagesRequest,
        progress: {
            strokeColor: {
                '0%': '#108ee9',
                '100%': '#87d068',
            },
            strokeWidth: 3,
            format: (percent) => percent && `${parseFloat(percent.toFixed(2))}%`,
        },
    };

    const showdelModal = () => {
        if(SelectDelete === 0){
            message.warning("待选中")
            return
        }else {
            setIsDelModalOpen(true);
        }
    };

    const handledelOk = () => {
        Delete()
        setIsDelModalOpen(false);
    };

    const handledelCancel = () => {
        setIsDelModalOpen(false);
    };


    return <div style={{height: '100%'}} className='allin'>
        <InfiniteScroll
        dataLength={staticDate.length}
        next={fetchData}
        hasMore={true}
        loader={null}
        endMessage={
            <p style={{ textAlign: 'center' }}>
                <b>Yay! You have seen it all</b>
            </p>
        }
    >
            <div style={{display: "flex",flexDirection: 'row',alignItems:'center',justifyContent: 'space-between',marginTop: 30,marginLeft: 20,marginRight: 20}} className={"action_img"}>
                <Space>
                    <UpLoadButton onClick={showModal} />
                    <Button icon={<FolderAddOutlined />} onClick={showFolderModal}>新建文件夹</Button>
                    <Button icon={<SwapOutlined />} onClick={showMoveModal}>移动到</Button>
                </Space>
                <div style={{ display: "flex", flexDirection: 'row', alignItems: 'center' }}>
                    <h2 style={{display: "flex", flexDirection: 'row', alignItems: 'center'}}> <i className="iconfont icon-xiangce icon" style={{ fontWeight: '80', fontSize: 50, color: '#1668dc' }} /> 图库  </h2>
                </div>
                <div style={{display: "flex",alignItems:'center'}}>
                    <h2 style={{position: "absolute", right: 180, opacity: SelectDelete !== 0 ? 1 : 0, transition: '0.3s'}}>已选中{SelectDelete}张图片</h2>
                    <div onClick={showdelModal}>
                        <DeleteButton />
                    </div>
                </div>
            </div>
            <div className="album-folder-bar">
                <FolderOpenOutlined />
                <span>当前文件夹</span>
                <Select
                    value={currentFolder}
                    onChange={(value) => {
                        setCurrentFolder(value);
                        setCheckStatus({});
                        setSelectDelete(0);
                    }}
                    style={{ width: 220 }}
                    options={folders.map(folder => ({
                        value: folder.folderName,
                        label: `${folder.folderName} (${folder.imageCount})`
                    }))}
                />
            </div>
            <Card style={{ width: '100%', height: '86vh', marginLeft: '0%', marginTop: '0%', overflowY: 'scroll', backgroundColor: 'transparent', border: "none" }}>
                {staticDate.map(item => (
                    <div key={item.imageKey} className='album-item'>
                        <div style={{ position: 'absolute', top: 30, right: 40, transform: 'scale(0.8)',zIndex: 3 }}>
                            <CheckButton
                                checked={checkStatus[item.imageUrl] || false}
                                handleCheckBoxChange={() => handleItemClick(item)}
                            />
                        </div>
                        <img
                            src={resolveImageUrl(item.imageUrl)}
                            onClick={() => handleItemClick(item)}
                            style={{ maxWidth: 250, maxHeight: 250, margin: 40, marginLeft: 45, marginTop: 30, borderRadius: 10 }}
                            className='imgShade'
                        />
                        <button className='album-url' onClick={() => copyUploadUrl(item.imageUrl)} title={item.imageUrl}>
                            {item.imageUrl}
                        </button>
                    </div>
                ))}
            </Card>

            <Modal
                   open={isModalOpen}
                   onOk={handleOk}
                   onCancel={handleCancel}
                   okText='完成'
                   cancelText='取消'
            >
                <Dragger {...props} listType='picture'>
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">点击或拖动文件到此区域进行上传</p>
                    <p className="ant-upload-hint">
                        支持单个或批量上传
                    </p>
                </Dragger>
                {lastUploadUrl && (
                    <div
                        onClick={() => copyUploadUrl(lastUploadUrl)}
                        style={{ marginTop: 16, padding: 12, borderRadius: 6, background: '#f5f7fb', cursor: 'pointer', wordBreak: 'break-all' }}
                    >
                        {lastUploadUrl}
                    </div>
                )}


            </Modal>
    </InfiniteScroll>

        <Modal title="删除确认" open={isModaldelOpen} onOk={handledelOk} onCancel={handledelCancel}  okText="确定" cancelText="取消">
            是否删除选中所有图片?
        </Modal>
        <Modal title="新建文件夹" open={isFolderModalOpen} onOk={handleCreateFolder} onCancel={() => setIsFolderModalOpen(false)} okText="创建" cancelText="取消">
            <Form form={folderForm} layout="vertical">
                <Form.Item
                    name="folderName"
                    label="文件夹名称"
                    rules={[
                        { required: true, message: '请输入文件夹名称' },
                        { max: 50, message: '文件夹名称不能超过50个字符' },
                    ]}
                >
                    <Input placeholder="请输入文件夹名称" />
                </Form.Item>
            </Form>
        </Modal>
        <Modal title="移动图片" open={isMoveModalOpen} onOk={handleMoveImages} onCancel={() => setIsMoveModalOpen(false)} okText="移动" cancelText="取消">
            <Select
                value={moveTargetFolder}
                onChange={setMoveTargetFolder}
                style={{ width: '100%' }}
                options={folders.map(folder => ({
                    value: folder.folderName,
                    label: folder.folderName
                }))}
            />
        </Modal>
    </div>
}

export default Albums
