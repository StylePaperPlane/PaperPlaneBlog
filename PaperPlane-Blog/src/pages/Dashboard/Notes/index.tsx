import './index.sass';
import {Outlet, useLocation, useNavigate} from "react-router-dom";
import {
    AppstoreOutlined,
    EditOutlined,
    FileTextOutlined,
    TagsOutlined
} from "@ant-design/icons";

const Notes = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const items = [
        {label: '全部文章', path: '/dashboard/notes', icon: <FileTextOutlined />, exact: true},
        {label: '编辑文章', path: '/dashboard/notes/newnote', icon: <EditOutlined />},
        {label: '分类管理', path: '/dashboard/notes/allcategorize', icon: <AppstoreOutlined />},
        {label: '标签管理', path: '/dashboard/notes/alltags', icon: <TagsOutlined />}
    ];

    return (
        <div className="notes-admin">
            <div className="notes-subnav" aria-label="笔记管理导航">
                {items.map(item => {
                    const active = item.exact
                        ? location.pathname === item.path || location.pathname === `${item.path}/`
                        : location.pathname.startsWith(item.path);
                    return (
                        <button
                            key={item.path}
                            className={active ? 'is-active' : ''}
                            type="button"
                            onClick={() => navigate(item.path)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </div>
            <div className="notes-admin-content">
                <Outlet />
            </div>
        </div>
    );
};

export default Notes;
