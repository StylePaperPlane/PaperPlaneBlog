/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { AuthRouter } from "../components/AuthRouter.tsx";

const App = lazy(() => import("../App.tsx"));
const Login = lazy(() => import("../pages/Login"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Notes = lazy(() => import("../pages/Dashboard/Notes"));
const Comments = lazy(() => import("../pages/Dashboard/Talks"));
const Albums = lazy(() => import("../pages/Dashboard/Albums"));
const Friends = lazy(() => import("../pages/Dashboard/Friends"));
const Music = lazy(() => import("../pages/Dashboard/Music"));
const UserControl = lazy(() => import("../pages/Dashboard/UserControl"));
const AllNotes = lazy(() => import("../pages/Dashboard/Notes/AllNotes"));
const NewNotes = lazy(() => import("../pages/Dashboard/Notes/NewNotes"));
const AllCategorize = lazy(() => import("../pages/Dashboard/Notes/AllCategorize"));
const AllTag = lazy(() => import("../pages/Dashboard/Notes/AllTag"));
const ContentHome = lazy(() => import("../frontHome/Content/ContentHome"));
const AboutMe = lazy(() => import("../frontHome/Content/AboutMe"));
const FriendList = lazy(() => import("../frontHome/Content/FriendList"));
const Talk = lazy(() => import("../frontHome/Content/Talk"));
const Times = lazy(() => import("../frontHome/Content/Times"));
const NotFound = lazy(() => import("../components/NotFound"));
const ReadArticle = lazy(() => import("../frontHome/Content/ReadArticle"));

const withSuspense = (element: JSX.Element) => (
    <Suspense fallback={null}>
        {element}
    </Suspense>
);

const router = createBrowserRouter([
    {
        path: '/',
        element: withSuspense(<App />),
        children: [
            {
                index: true,
                element: withSuspense(<ContentHome />)
            },
            {
                path: 'about',
                element: withSuspense(<AboutMe />)
            },
            {
                path: 'friends',
                element: withSuspense(<FriendList />)
            },
            {
                path: "talk",
                element: withSuspense(<Talk />)
            },
            {
                path: 'times',
                element: withSuspense(<Times />)
            },
            {
                path: 'article/:id',
                element: withSuspense(<ReadArticle />)
            }
        ]
    },
    {
        path: 'login',
        element: withSuspense(<Login />)
    },
    {
        path: '/dashboard',
        element: <AuthRouter>{withSuspense(<Dashboard />)}</AuthRouter>,
        children: [
            {
                index: true,
                element: <Navigate to="notes" replace />
            },
            {
                path: 'notes',
                element: withSuspense(<Notes />),
                children: [
                    {
                        index: true,
                        element: withSuspense(<AllNotes />)
                    },
                    {
                        path: 'newnote/:id?', // 在:id后面加上问号?表示id参数可选
                        element: withSuspense(<NewNotes />),
                    },
                    {
                        path: 'allcategorize',
                        element: withSuspense(<AllCategorize />)
                    },
                    {
                        path: 'alltags',
                        element: withSuspense(<AllTag />)
                    }
                ]
            },
            {
                path: 'comments',
                element: withSuspense(<Comments />)
            },
            {
                path: 'albums',
                element: withSuspense(<Albums />)
            },
            {
                path: 'friends',
                element: withSuspense(<Friends />)
            },
            {
                path: 'music',
                element: withSuspense(<Music />)
            },
            {
                path: 'usercontrol',
                element: withSuspense(<UserControl />)
            }
        ]
    },
    {
        path: '*',
        element: withSuspense(<NotFound />)
    }
])

export default router
