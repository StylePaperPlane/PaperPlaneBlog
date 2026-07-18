import type {NavigationItem} from './navigationItems';

type NavigationItemContentProps = Pick<NavigationItem, 'iconPath' | 'label'>;

const NavigationItemContent = ({iconPath, label}: NavigationItemContentProps) => (
    <span className="navItemContent">
        <img
            className="navItemIcon"
            src={iconPath}
            alt=""
            aria-hidden="true"
            draggable={false}
        />
        <span>{label}</span>
    </span>
);

export default NavigationItemContent;
