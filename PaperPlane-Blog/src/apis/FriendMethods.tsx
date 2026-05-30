import http from "./axios.tsx";
import {Friend} from "../interface/FriendType";

function getFriendsList(){
    return http({
        url: '/api/public/friends',
        method: 'GET'
    })
}

function delFriends(keysToDelete:number[]){
    return  http({
        url: '/api/protected/friends',
        method: 'DELETE',
        data: keysToDelete
    })
}

function addFriend(value:Friend){
    return  http({
        url: '/api/protected/friends',
        method: 'POST',
        data: value
    })
}

export {getFriendsList,delFriends,addFriend}
