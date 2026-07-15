import {useEffect, useRef, useState} from 'react';
import './index.css';
import {Outlet, useLocation, useNavigate} from "react-router-dom";
import deleteToken from "../../apis/deleteToken.tsx";
import {Button, Space, notification, message, Spin, Tooltip} from "antd";
import {useDispatch, useSelector} from "react-redux";
import {fetchUserInfo} from "../../store/components/user.tsx";
import UserState from "../../interface/UserState";
import {fetchCategories} from "../../store/components/categories.tsx";
import {fetchTags} from "../../store/components/tags.tsx";
import {fetchNoteList} from "../../store/components/note.tsx";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import {AppDispatch} from "../../store";
import {
    CustomerServiceOutlined,
    ExpandOutlined,
    FileTextOutlined,
    HomeOutlined,
    LinkOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    MessageOutlined,
    PictureOutlined,
    SettingOutlined
} from "@ant-design/icons";
import {resolveImageUrl} from "../../utils/imageUrl.ts";

interface FullscreenElement extends HTMLDivElement {
    mozRequestFullScreen?: () => Promise<void> | void;
    webkitRequestFullscreen?: () => Promise<void> | void;
    msRequestFullscreen?: () => Promise<void> | void;
}

interface FullscreenDocument extends Document {
    mozCancelFullScreen?: () => Promise<void> | void;
    webkitExitFullscreen?: () => Promise<void> | void;
    msExitFullscreen?: () => Promise<void> | void;
}

const requestFullscreen = (element: FullscreenElement | null) => {
    if (!element) return;
    const request =
        element.requestFullscreen ||
        element.mozRequestFullScreen ||
        element.webkitRequestFullscreen ||
        element.msRequestFullscreen;
    request?.call(element);
};

const exitFullscreen = () => {
    const fullscreenDocument = document as FullscreenDocument;
    const exit =
        fullscreenDocument.exitFullscreen ||
        fullscreenDocument.mozCancelFullScreen ||
        fullscreenDocument.webkitExitFullscreen ||
        fullscreenDocument.msExitFullscreen;
    exit?.call(fullscreenDocument);
};

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isShellClosed, setShellClosed] = useState(false);
    const [api, contextHolder] = notification.useNotification();
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch<AppDispatch>();
    const avatar = useSelector((state: { user: UserState }) => state.user.avatar);
    const name = useSelector((state: { user: UserState }) => state.user.name);

    useEffect(() => {
        dispatch(fetchUserInfo());
        dispatch(fetchCategories());
        dispatch(fetchTags());
        dispatch(fetchNoteList());
        setLoading(true);
    }, [dispatch]);

    const openNotification = () => {
        const key = `open${Date.now()}`;
        api.open({
            message: '确认退出登录？',
            description: '退出后需要重新输入管理员账号和密码。',
            key,
            btn: (
                <Space>
                    <Button type="text" size="small" onClick={() => api.destroy()}>
                        取消
                    </Button>
                    <Button type="primary" size="small" onClick={() => {
                        deleteToken();
                        navigate('/login');
                        message.success('已退出登录');
                    }}>
                        退出
                    </Button>
                </Space>
            ),
        });
    };

    const sidebar = [
        {name: '笔记', icon: <FileTextOutlined />, to: '/dashboard/notes'},
        {name: '说说', icon: <MessageOutlined />, to: '/dashboard/comments'},
        {name: '图库', icon: <PictureOutlined />, to: '/dashboard/albums'},
        {name: '友链', icon: <LinkOutlined />, to: '/dashboard/friends'},
        {name: '音乐', icon: <CustomerServiceOutlined />, to: '/dashboard/music'}
    ];

    const fullScreenRef = useRef<FullscreenElement>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const toggleFullScreen = () => {
        if (!isFullScreen) {
            requestFullscreen(fullScreenRef.current);
            setIsFullScreen(true);
        } else {
            exitFullscreen();
            setIsFullScreen(false);
        }
    };

    const activeNav = sidebar.find(item => location.pathname.startsWith(item.to));
    const pageTitle = location.pathname.includes('/newnote')
        ? '编辑文章'
        : location.pathname.includes('/allcategorize')
            ? '分类管理'
            : location.pathname.includes('/alltags')
                ? '标签管理'
                : location.pathname.includes('/usercontrol')
                    ? '站点设置'
                    : activeNav?.name || '工作台';

    return (
        <div className={`dashboard-shell ${isShellClosed ? 'is-collapsed' : ''}`}>
            {!loading ? (
                <div className="loading-overlay">
                    <Spin tip="正在准备工作台..." />
                </div>
            ) : (
                <div className="dashboard-frame" ref={fullScreenRef}>
                    <aside className="dashboard-sidebar">
                        <div className="dashboard-brand">
                            <img src="/logo.png" alt="" />
                            <div className="dashboard-brand-copy">
                                <strong>PaperPlane</strong>
                                <span>Content Studio</span>
                            </div>
                        </div>

                        <nav className="dashboard-nav" aria-label="后台导航">
                            <p className="dashboard-nav-label">内容管理</p>
                            {sidebar.map(item => (
                                <button
                                    className={`dashboard-nav-item ${location.pathname.startsWith(item.to) ? 'is-active' : ''}`}
                                    type="button"
                                    onClick={() => navigate(item.to)}
                                    key={item.to}
                                    title={isShellClosed ? item.name : undefined}
                                >
                                    <span className="dashboard-nav-icon">{item.icon}</span>
                                    <span className="dashboard-nav-text">{item.name}</span>
                                </button>
                            ))}
                        </nav>

                        <div className="dashboard-sidebar-footer">
                            <button
                                className={`dashboard-nav-item ${location.pathname.includes('/usercontrol') ? 'is-active' : ''}`}
                                type="button"
                                onClick={() => navigate('/dashboard/usercontrol')}
                                title={isShellClosed ? '站点设置' : undefined}
                            >
                                <span className="dashboard-nav-icon"><SettingOutlined /></span>
                                <span className="dashboard-nav-text">站点设置</span>
                            </button>
                            <button className="dashboard-nav-item danger" type="button" onClick={openNotification}>
                                <span className="dashboard-nav-icon"><LogoutOutlined /></span>
                                <span className="dashboard-nav-text">退出登录</span>
                            </button>
                        </div>
                    </aside>

                    <section className="dashboard-main">
                        <header className="dashboard-topbar">
                            <div className="dashboard-topbar-start">
                                <button
                                    className="dashboard-icon-button"
                                    type="button"
                                    onClick={() => setShellClosed(!isShellClosed)}
                                    aria-label={isShellClosed ? '展开侧栏' : '收起侧栏'}
                                >
                                    {isShellClosed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                                </button>
                                <div className="dashboard-page-heading">
                                    <span>PaperPlane 管理后台</span>
                                    <h1>{pageTitle}</h1>
                                </div>
                            </div>

                            <div className="dashboard-topbar-actions">
                                <Tooltip title="查看博客">
                                    <button className="dashboard-icon-button" type="button" onClick={() => navigate('/')}>
                                        <HomeOutlined />
                                    </button>
                                </Tooltip>
                                <Tooltip title="全屏">
                                    <button className="dashboard-icon-button" type="button" onClick={toggleFullScreen}>
                                        <ExpandOutlined />
                                    </button>
                                </Tooltip>
                                <div className="dashboard-user">
                                    <img
                                        src={resolveImageUrl(avatar) || '/logo.png'}
                                        alt={`${name || 'PaperPlane'} 的头像`}
                                        onError={event => {
                                            event.currentTarget.src = '/logo.png';
                                        }}
                                    />
                                    <div>
                                        <strong>{name || 'PaperPlane'}</strong>
                                        <span>管理员</span>
                                    </div>
                                </div>
                            </div>
                        </header>

                        <main className="dashboard-content">
                            <div className="dashboard-surface">
                                <Outlet />
                            </div>
                        </main>
                    </section>
                    {contextHolder}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
