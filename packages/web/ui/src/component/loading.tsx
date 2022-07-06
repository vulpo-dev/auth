import { FC } from "react"

type LoadingProps = {
	size?: string;
	color?: string;
}

export let Flow: FC<LoadingProps> = ({ size, color }) => {

	let style = {
		['--size' as any]: size,
		['--color' as any]: color,
	}

	return (
		<div style={style} className="vulpo-auth-flow">
			<div className="vulpo-auth-flow-dot"></div>
			<div className="vulpo-auth-flow-dot"></div>
			<div className="vulpo-auth-flow-dot"></div>
		</div>
	)
}