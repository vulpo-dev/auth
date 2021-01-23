declare module '@tippyjs/react' {
    import { FC } from 'react';

    type Props = {
    	content?: string;
    }

    let Tippy: FC<Props>;
    export default Tippy;
}

