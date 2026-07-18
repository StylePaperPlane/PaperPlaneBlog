import {SocialType} from "./SocialType";

export default interface UserState{
    token: string | null;
    avatar: string;
    name: string;
    social: SocialType | null;
    blogTitle: string;
}
