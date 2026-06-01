import './index.sass'
import {useSelector} from "react-redux";
import { TagCloud } from 'react-tagcloud'
import type {RootState} from "../../store";

const WordCloud = () => {
    const categoryList = useSelector((state: RootState) => state.categories.categories).map(item => {
        return {
            value: item.categoryTitle,
            count: item.noteCount
        }
    })

    return <div className="wordCloud">
        <TagCloud
            minSize={10}
            maxSize={35}
            tags={categoryList}
        />
    </div>
}

export default WordCloud
