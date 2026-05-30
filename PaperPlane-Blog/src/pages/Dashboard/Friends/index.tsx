import './index.sass';
import {Avatar, Button, Form, Input, message, Modal, Space, Table, Tag, Typography} from "antd";
import type {TableProps} from "antd";
import {PlusOutlined} from "@ant-design/icons";
import {useContext, useEffect, useState} from "react";
import {Friend} from "../../../interface/FriendType";
import MainContext from "../../../components/conText.tsx";
import {addFriend, delFriends, getFriendsList} from "../../../apis/FriendMethods.tsx";

const {Text, Link} = Typography;

const Friends = () => {
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [staticDate, setStaticDate] = useState<Friend[]>([]);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const Mode = useContext(MainContext);
    const [isModaldelOpen, setIsDelModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        initFriendsList();
        setIsDarkMode(Mode === 'true');
    }, [Mode]);

    const initFriendsList = () => {
        getFriendsList().then((res) => {
            setStaticDate(res.data.data);
        }).catch((error) => {
            message.error('获取朋友列表时出错:', error);
        });
    };

    const deleteSelected = () => {
        if (selectedRowKeys.length === 0) {
            message.warning('待选中');
            return;
        }

        delFriends(selectedRowKeys as number[]).then((res) => {
            if (res.status === 200) {
                initFriendsList();
                message.success('删除成功');
                setSelectedRowKeys([]);
            }
        });
    };

    const addOk = async () => {
        try {
            const values = await form.validateFields();
            const res = await addFriend({
                ...values,
                status: 1
            } as Friend);
            if (res.status === 200) {
                message.success('添加成功');
                form.resetFields();
                setIsAddModalOpen(false);
                initFriendsList();
            }
        } catch (error) {
            if (error instanceof Error) {
                message.error('添加失败');
            }
        }
    };

    const columns: TableProps<Friend>['columns'] = [
        {
            title: '站点',
            dataIndex: 'siteName',
            key: 'siteName',
            width: 260,
            render: (_, item) => (
                <Space size={12}>
                    <Avatar src={item.avatar} size={44} />
                    <div className="friend-site">
                        <Text strong>{item.siteName}</Text>
                        <Text type="secondary">{item.avatar}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: '链接',
            dataIndex: 'siteUrl',
            key: 'siteUrl',
            width: 280,
            render: (siteUrl) => (
                <Link href={siteUrl} target="_blank" ellipsis>
                    {siteUrl}
                </Link>
            )
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            render: (description) => <Text>{description}</Text>
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            align: 'center',
            render: () => <Tag color="blue">展示中</Tag>
        }
    ];

    return (
        <div className='friends-admin allin'>
            <div className="friends-toolbar">
                <div>
                    <h2 style={{ color: isDarkMode ? 'cornflowerblue' : '#1f2937' }}>友链管理</h2>
                    <p>共 {staticDate.length} 条友链，已选 {selectedRowKeys.length} 条</p>
                </div>
                <Space>
                    <Button danger disabled={selectedRowKeys.length === 0} onClick={() => setIsDelModalOpen(true)}>
                        删除
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)}>
                        新增友链
                    </Button>
                </Space>
            </div>

            <Table
                className="friends-table"
                rowKey="friendKey"
                columns={columns}
                dataSource={staticDate}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys
                }}
            />

            <Modal title="删除确认" open={isModaldelOpen} onOk={() => {
                deleteSelected();
                setIsDelModalOpen(false);
            }} onCancel={() => setIsDelModalOpen(false)} okText="确定" cancelText="取消">
                是否删除选中所有友链?
            </Modal>

            <Modal title="新增友链" open={isAddModalOpen} onOk={addOk} onCancel={() => setIsAddModalOpen(false)} okText="保存" cancelText="取消">
                <Form form={form} layout="vertical">
                    <Form.Item label="站点名称" name="siteName" rules={[{ required: true, message: '请输入站点名称' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="站点链接" name="siteUrl" rules={[{ required: true, message: '请输入站点链接' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="头像链接" name="avatar" rules={[{ required: true, message: '请输入头像链接' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="站点描述" name="description" rules={[{ required: true, message: '请输入站点描述' }]}>
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Friends;
