import {useEffect, useRef, useState} from 'react';
import './index.css';
// import '../../assets/font/iconfont.js';
// import '../../assets/font/iconfont.css';
import {Outlet, useNavigate} from "react-router-dom";
import deleteToken from "../../apis/deleteToken.tsx";
import {Button, Space, notification, message, Card, Spin} from "antd";
import SettingButton from "../../components/Buttons/SettingButton";
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
    if (!element) {
        return;
    }

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
    //hooks区域
    const navigate = useNavigate();
    const [SelectCurrent,setSelectCurrent] = useState(1)
    const [isShellClosed, setShellClosed] = useState(true);
    const [api, contextHolder] = notification.useNotification();
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch<AppDispatch>();
    const avatar = useSelector((state: { user: UserState }) => state.user.avatar);
    const name = useSelector((state: { user: UserState }) => state.user.name);

    //初始渲染
    useEffect(() => {
        dispatch(fetchUserInfo())
        dispatch(fetchCategories())
        dispatch(fetchTags())
        dispatch(fetchNoteList())
        const currentHashCode =
            location.hash === '#/dashboard/comments' ? 3 :
                location.hash === '#/dashboard/albums' ? 4 :
                    location.hash === '#/dashboard/friends' ? 5 :
                        location.hash === '#/dashboard/music' ? 6 :
                            location.hash.startsWith('#/dashboard/notes') || location.hash === '#/dashboard' ? 2 : 2;
        setSelectCurrent(currentHashCode)
        setLoading(true);
    },[dispatch])

    //回调函数区域
    const openNotification = () => {
        const key = `open${Date.now()}`
        const btn = (
            <Space>
                <Button type="link" size="small" onClick={() => api.destroy()}>
                    返回
                </Button>
                <Button type="primary" size="small" onClick={() => {
                    deleteToken()
                    navigate('/')
                    message.success('退出成功')
                }}>
                    确认
                </Button>
            </Space>
        );
        api.open({
            message: '退出确认',
            btn,
            key,
        });
    };

    const handleToggleClick = () => {
        setShellClosed(!isShellClosed);
    };

    const handleSearchClick = () => {
        setShellClosed(false);
    };

    // 导航栏数据
    const sidebar = [
        {
            index: 2,
            name: '笔记',
            icon: 'icon-bianji2',
            to: 'notes',
            active: false,
            children: [
                {
                    index: 201,
                    name: '全部文章',
                    to: 'allnotes',
                },
                {
                    index: 202,
                    name: '编辑文章',
                    to: 'newnote',
                },{
                    index: 203,
                    name: '全部分类',
                    to: 'allcategorize',
                },{
                    index: 204,
                    name: '全部标签',
                    to: 'alltags',
                },
            ]
        },
        {
            index: 3,
            name: '说说',
            icon: 'icon-pinglun2',
            to: 'comments',
            active: false
        },
        {
            index: 4,
            name: '图库',
            icon: 'icon-xiangce',
            to: 'albums',
            active: false
        },
        {
            index: 5,
            name: '友链圈',
            icon: 'icon-youlianguanli',
            to: 'friends',
            active: false
        },
        {
            index: 6,
            name: '音乐',
            icon: 'icon-yinle',
            to: 'music',
            active: false
        }
    ]


    //全屏
    const fullScreenRef = useRef<FullscreenElement>(null);
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

    const toggleFullScreen = () => {
        if (!isFullScreen) {
            requestFullscreen(fullScreenRef.current);
            setIsFullScreen(true);
        } else {
            exitFullscreen();
            setIsFullScreen(false);
        }
    };

    return (
        <div className="contain">
            {!loading ? (
                <div className="loading-overlay">
                    <Spin tip="Loading..." className="loading">
                    </Spin>
                </div>
            ) : (
                <>

                    <div className="content" ref={fullScreenRef}>
                        <div className={`shell ${isShellClosed ? 'close' : ''} slider`}>
                            <nav className={`shell ${isShellClosed ? 'close' : ''}`}>
                                <header>
                                    <div className="image-text">
                        <span className="image">
                            <img src={avatar} alt="" />
                        </span>
                                        <div className="text logo-text">
                                            <span className="name">
                                                {name}
                                            </span>
                                        </div>
                                    </div>
                                    <i className="iconfont icon-iconfonticonfontarrowright toggle" onClick={handleToggleClick} style={{fontSize: 20}}></i>
                                </header>

                                <div className="menu-bar">
                                    <div className="menu">
                                        <li className="search-box" onClick={handleSearchClick}>
                                            <i className="iconfont icon-sousuo1 icon"></i>
                                            <input type="text" placeholder="search..." />
                                        </li>

                                        <ul className="menu-links">
                                            {sidebar.map(item => (
                                                <li className={`nav-links ${SelectCurrent === item.index ? 'nav_select' : ''}`}
                                                    onClick={() => {
                                                        navigate(item.to)
                                                        setSelectCurrent(item.index)
                                                    }} key={item.index}>
                                                    <i className={`iconfont ${item.icon} icon`}></i>
                                                    <span className="text nac-text">{item.name}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="bottom-content">
                                        <li className="nav-links" onClick={() => navigate('usercontrol')}>
                                            <i className="iconfont icon-iconfontcog icon"></i>
                                            <span className="text nac-text">用户管理</span>
                                        </li>

                                        <li className="nav-links" onClick={openNotification}>
                                            <i className="iconfont icon-tuichu icon"></i>
                                            <span className="text nac-text">退出登录</span>
                                        </li>
                                    </div>
                                </div>
                            </nav>
                        </div>
                        <Card style={{ width: "90%",height: '95%' ,marginLeft:80}} className="Card">
                            <Outlet />
                        </Card>

                        {/*  悬浮按钮  */}

                        <div className='setting_btn' onClick={()=>toggleFullScreen()}>
                            <SettingButton />
                        </div>
                    </div>

            {contextHolder}
                </>
                )}
        </div>
    );
};

export default Dashboard;
