import http from "./axios.tsx";
import {Talk, updateTalk} from "../interface/TalkType";

function getTalkList(){
    return http({
        url: '/api/public/talk',
        method: "GET"
    })
}

function updateTalkById(data:updateTalk,isEdit: number){
    return http({
        url: `/api/protected/talk/${isEdit}`,
        method: "POST",
        data: data
    })
}

function delTalkById(id: number){
    return http({
        url: `/api/protected/talk/${id}`,
        method: "DELETE"
    })
}

function createTalk(data:Talk){
    return http({
        url: '/api/protected/talk',
        method: "POST",
        data: data
    })
}

export {getTalkList,updateTalkById,delTalkById,createTalk}
