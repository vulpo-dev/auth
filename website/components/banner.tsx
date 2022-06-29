import { ReactNode } from "react"

type Props = {
	children: ReactNode
}

let Banner = (props: Props) => {
	return (
		<div className="marquee">
			<div className="marquee__inner" aria-hidden="true">
				{ props.children }
			</div>
			<style jsx>{`

				.marquee {
					--marquee-width: 100vw;
					--offset: 20vw;
					--move-initial: calc(-25% + var(--offset));
					--move-final: calc(-50% + var(--offset));
					--item-font-size: 8vw;

					position: absolute;
					top: 0;
					left: 0;
					width: var(--marquee-width);
					overflow: hidden;
					pointer-events: none;
				}

				.marquee__inner {
					width: fit-content;
					display: flex;
					column-gap: 2rem;
					position: relative;
					transform: translate3d(var(--move-initial), 0, 0);
					animation: marquee 13s linear infinite;
					opacity: 1;
					transition-duration: 0.4s;
				}

				.marquee > * {
					text-align: center;
					white-space: nowrap;
					font-size: var(--item-font-size);
					padding: 0 1vw;
					font-weight: 800;
					line-height: 1.15;
				}

				@keyframes marquee {
					0% {
						transform: translate3d(var(--move-initial), 0, 0);
					}

					100% {
						transform: translate3d(var(--move-final), 0, 0);
					}
				}
			`}</style>
		</div>
	)
}

export default Banner
