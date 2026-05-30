import ReactDOM from 'react-dom/client'
import './index.css'
import {RouterProvider} from "react-router-dom";
import router from "./router";
import {Provider} from "react-redux";
import store from "./store";
import MusicPlayer from "./components/MusicPlayer";

ReactDOM.createRoot(document.getElementById('root')!).render(
        <Provider store={store}>
            <MusicPlayer />
            <RouterProvider router={router}>
            </RouterProvider>
        </Provider>
)
