import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import SiteSocialLinks from './SiteSocialLinks';

const emptySocial = {
    socialGithub: null,
    socialEmail: null,
    socialBilibili: null,
    socialQQ: null,
    socialNeteaseCloud: null,
};

describe('SiteSocialLinks', () => {
    it('renders nothing when every setting is empty', () => {
        const {container} = render(<SiteSocialLinks social={emptySocial}/>);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders only configured links', () => {
        render(<SiteSocialLinks social={{
            ...emptySocial,
            socialGithub: 'https://github.com/paperplane',
            socialEmail: 'hello@example.com',
        }}/>);

        expect(screen.getByRole('link', {name: 'GitHub'})).toHaveAttribute(
            'href',
            'https://github.com/paperplane',
        );
        expect(screen.getByRole('link', {name: 'Email'})).toHaveAttribute(
            'href',
            'mailto:hello@example.com',
        );
        expect(screen.queryByRole('link', {name: 'QQ'})).not.toBeInTheDocument();
    });
});
