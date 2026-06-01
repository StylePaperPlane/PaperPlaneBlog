import { useSelector } from "react-redux";
import type {NoteType} from "../interface/NoteType";
import type {RootState} from "../store";

// 自定义 hook
const useCountNote = (categoryTitle: string) => {
    const noteList = useSelector((state: RootState) => state.notes.Notes)
    return noteList.filter((item: NoteType) => item.noteCategory === categoryTitle).length;
}

export default useCountNote;
