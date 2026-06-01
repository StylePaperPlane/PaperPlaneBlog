
import './index.sass'
import {Breadcrumb, ConfigProvider, Menu, MenuProps} from "antd";
import {AppstoreOutlined} from "@ant-design/icons";
import { UserOutlined } from '@ant-design/icons';
import {Link, Outlet, useNavigate} from "react-router-dom";
import React, {useEffect, useState} from "react";

//Menu数据
type MenuItem = Required<MenuProps>['items'][number];
function getItem(
    label: React.ReactNode,
    key?: React.Key | null,
    icon?: React.ReactNode,
    children?: MenuItem[],
): MenuItem {
    return {
        key,
        icon,
        children,
        label,
    } as MenuItem;
}

const noteMenuRoutes: Record<string, string> = {
    '1': ' ',
    '2': 'newnote',
    '3': 'allcategorize',
    '4': 'alltags',
};

const items: MenuItem[] = [
    getItem('导航', 'sub2', <AppstoreOutlined />, [
        getItem('全部文章', '1',''),
        getItem('编辑文章', '2',''),
        getItem('全部分类', '3',''),
        getItem('全部标签', '4',''),
    ]),
];

const Notes = () => {
    //hooks区域
    const navigate = useNavigate()
    const [currentHashCode,setCurrentHashCode] = useState('')

    useEffect(() => {
       setCurrentHashCode(location.hash)
    },[])

    // 回调函数区域
    const ClickMenu: MenuProps['onClick'] = (e) => {
        navigate(noteMenuRoutes[e.key])
    };

    return <>
        <ConfigProvider
            theme={{
                components: {
                    Menu: {
                        itemSelectedColor: 'rgba(0,0,0,0.88)',
                        itemSelectedBg: '#e6f4ff'
                    },
                    Breadcrumb: {
                        itemColor: 'rgba(0,0,0,0.88)',
                        lastItemColor: 'rgba(0,0,0,0.88)',
                        linkColor: 'rgba(0,0,0,0.88)',
                        separatorColor: 'rgba(0,0,0,0.45)',
                    }
                },
            }}
        >
            <div className="header">

                <Menu
                    style={{ width: 125 }}
                    mode="vertical"
                    items={items}
                    className="twoMenu"
                    onClick={ClickMenu}
                    defaultSelectedKeys={['1']}
                    theme="light"
                />
                <Breadcrumb style={{ marginLeft: 10 }}>
                    <Breadcrumb.Item>
                        <Link to="/dashboard/notes">
                            <UserOutlined />
                            <span>笔记</span>
                        </Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        {
                            currentHashCode === '#/dashboard/notes' ? (
                            '全部文章'
                        ) : currentHashCode === '#/dashboard/notes/' ? (
                            '全部文章'
                        ) : currentHashCode === '#/dashboard/notes/newnote' ? (
                            '编辑文章'
                        ) : currentHashCode === '#/dashboard/notes/allcategorize' ? (
                            '全部分类'
                        ) : currentHashCode === '#/dashboard/notes/alltags' ? (
                                '全部标签'
                        ) : (
                                '未知页面'
                        )}
                    </Breadcrumb.Item>
                </Breadcrumb>
            </div>
        </ConfigProvider>

        <Outlet />
    </>
}

export default Notes
