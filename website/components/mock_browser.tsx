import { ReactNode } from "react"


type Props = {
	children?: ReactNode,
}

let MockBrowser = (props: Props) => {
	return (
		<div className="mock-browser-wrapper">
			<div className="top-bar"></div>
			<div className="content">{ props.children }</div>

			<style jsx>{`
				.mock-browser-wrapper {
					border: 2px solid #000;
					width: 100%;
					height: 100%;
					display: flex;
					align-items: center;
					flex-direction: column;
					background: #fff;
					overflow: auto;
				}

				.top-bar {
					height: 30px;
					width: 100%;
					background: #1c1a1a;
					flex-shrink: 0;
					display: flex;
					align-items: center;
					justify-content: flex-end;
					padding: 5px 1rem;
				}

				.content {
					width: 100%;
					flex-grow: 1;
				}
			`}</style>
		</div>
	)
}

export default MockBrowser
