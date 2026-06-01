import {Avatar} from 'antd'
import {CloseOutlined, MenuOutlined} from '@ant-design/icons';
import './index.sass'
import {useEffect, useRef, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import Switch from "../../components/Switch";
import TopMao from "../../components/TopMao";
import {useDispatch, useSelector} from "react-redux";
import {fetchTags} from "../../store/components/tags.tsx";
import {fetchSocial, fetchUserInfo} from "../../store/components/user.tsx";
import {fetchNoteList} from "../../store/components/note.tsx";
import UserState from "../../interface/UserState";
import '../main.css'
import {AppDispatch} from "../../store";
interface HeadProps {
    setDark: (value: (((prevState: boolean) => boolean) | boolean)) => void,
    isDark: boolean,
    scrollHeight: number
}

const Head = ({ setDark, isDark, scrollHeight }: HeadProps) => {
    const [phoneBarShow, setPhoneBarShow] = useState(false);
    const [navHidden, setNavHidden] = useState(false);
    const previousScrollRef = useRef(0);
    const touchYRef = useRef<number | null>(null);
    const dispatch = useDispatch<AppDispatch>()
    const navigate = useNavigate();
    const location = useLocation();
    const avatar = useSelector((state:{user:UserState}) => state.user.avatar)
    const blogTitle = useSelector((state:{user:{blogTitle: string}}) => state.user.blogTitle)

    useEffect(() => {
        dispatch(fetchTags())
        dispatch(fetchUserInfo())
        dispatch(fetchNoteList())
        dispatch(fetchSocial())
    }, [dispatch]);

    useEffect(() => {
        const previousScroll = previousScrollRef.current;
        if (phoneBarShow) {
            setNavHidden(false);
        } else if (scrollHeight > previousScroll) {
            setNavHidden(true);
        } else if (scrollHeight < previousScroll) {
            setNavHidden(false);
        }

        previousScrollRef.current = scrollHeight;
    }, [scrollHeight, phoneBarShow]);

    useEffect(() => {
        const canToggleHeader = () => !phoneBarShow;
        const updateByDelta = (delta: number) => {
            if (!canToggleHeader() || Math.abs(delta) < 8) return;
            setNavHidden(delta > 0);
        };
        const handleWheel = (event: WheelEvent) => {
            updateByDelta(event.deltaY);
        };
        const handleTouchStart = (event: TouchEvent) => {
            touchYRef.current = event.touches[0]?.clientY ?? null;
        };
        const handleTouchMove = (event: TouchEvent) => {
            if (touchYRef.current === null) return;

            const currentY = event.touches[0]?.clientY ?? touchYRef.current;
            updateByDelta(touchYRef.current - currentY);
            touchYRef.current = currentY;
        };
        const handleTouchEnd = () => {
            touchYRef.current = null;
        };

        window.addEventListener('wheel', handleWheel, {passive: true});
        window.addEventListener('touchstart', handleTouchStart, {passive: true});
        window.addEventListener('touchmove', handleTouchMove, {passive: true});
        window.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('touchcancel', handleTouchEnd);

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [phoneBarShow]);

    useEffect(() => {
        setNavHidden(false);
    }, [location.pathname]);

    const handleModeSwitch = () => {
        setDark(!isDark)
        localStorage.setItem("isDarkMode", JSON.stringify(!isDark));
    };

    const navItems = [
        { label: '首页', path: '/' },
        { label: '归档', path: '/times' },
        { label: '说说', path: '/talk' },
        { label: '友人链', path: '/friends' },
        { label: '关于我', path: '/about' },
    ];

    const goPath = (path: string) => {
        setPhoneBarShow(false);
        navigate(path);
    };

    const isActive = (path: string) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <header className={`frontHeader ${isDark ? 'frontDark' : ''}`}>
            {phoneBarShow && <button className="phoneScrim" type="button" aria-label="关闭导航" onClick={() => setPhoneBarShow(false)} />}
            <div className={`${phoneBarShow ? 'openBar' : ''} phoneSide`}>
                <div className="phoneBarContainer">
                    <div className="barLogo">
                        <Avatar
                            src={avatar}
                            size={100}/>
                    </div>
                    <div className="barContent">
                        <ul className='oneBar'>
                            {navItems.map(item => (
                                <li
                                    key={item.path}
                                    className={isActive(item.path) ? 'active' : ''}
                                    onClick={() => goPath(item.path)}
                                >
                                    {item.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            <TopMao currentScrollHeight={scrollHeight}/>
            <div className={`headContainer ${scrollHeight ? 'isScrolled' : ''} ${navHidden ? 'isHidden' : ''}`}>
                <div className="phoneBar">
                    <button
                        className="phoneMenuButton"
                        type="button"
                        aria-label={phoneBarShow ? '关闭导航' : '打开导航'}
                        onClick={() => setPhoneBarShow(!phoneBarShow)}
                    >
                        {phoneBarShow ? <CloseOutlined /> : <MenuOutlined />}
                    </button>
                </div>
                <div className="webTitle" onClick={()=>navigate('/')}>
                    <h2><span className="firstTitle">{blogTitle}</span><span className="secondTitle">Blog</span></h2>
                </div>
                <div className="headBar">
                    <ul>
                        {navItems.map(item => (
                            <li
                                key={item.path}
                                className={isActive(item.path) ? 'active' : ''}
                                onClick={() => goPath(item.path)}
                            >
                                {item.label}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="homeRight">
                    <div className={'homeSwitch'}><Switch handleModeSwitch={handleModeSwitch} isDarkMode={isDark}/></div>
                    <div className="homeLogo">
                        <Avatar src={avatar} size='large'/>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Head;
