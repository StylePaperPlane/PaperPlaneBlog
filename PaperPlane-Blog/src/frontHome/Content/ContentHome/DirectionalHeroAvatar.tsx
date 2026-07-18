import {PointerEvent, useState} from 'react';
import {Avatar} from 'antd';
import {AvatarSpinDirection, resolveAvatarSpinDirection} from './avatarSpin';

interface DirectionalHeroAvatarProps {
    src: string;
}

const DirectionalHeroAvatar = ({src}: DirectionalHeroAvatarProps) => {
    const [direction, setDirection] = useState<AvatarSpinDirection>('clockwise');

    const handlePointerEnter = (event: PointerEvent<HTMLSpanElement>) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        setDirection(resolveAvatarSpinDirection(event.clientX, bounds.left, bounds.width));
    };

    return (
        <span
            className="frontAvatarInteraction"
            data-spin-direction={direction}
            onPointerEnter={handlePointerEnter}
        >
            <Avatar src={src} size={236} className="frontAvatar"/>
        </span>
    );
};

export default DirectionalHeroAvatar;
