export interface NavigationItem {
    label: string;
    path: string;
    iconPath: string;
}

export const navigationItems: readonly NavigationItem[] = [
    {label: '首页', path: '/', iconPath: '/navigation-icons/home.png'},
    {label: '归档', path: '/times', iconPath: '/navigation-icons/archive.png'},
    {label: '说说', path: '/talk', iconPath: '/navigation-icons/talk.png'},
    {label: '友人链', path: '/friends', iconPath: '/navigation-icons/friends.png'},
    {label: '关于我', path: '/about', iconPath: '/navigation-icons/about.png'},
];
