declare module '@tippyjs/react' {
    import { FC } from 'react';

    type Props = {
    	content?: string;
    	delay?: number | [number | null, number | null];
    }

    let Tippy: FC<Props>;
    export default Tippy;
}

