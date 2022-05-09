import React, { FC } from "react"

type LoadingProps = {
	size?: string;
	color?: string;
}

export let Flow: FC<LoadingProps> = ({ size, color }) => {

	let style = {
		'--size': size,
		'--color': color,
	} as React.CSSProperties

	return (
		<div style={style} className="vulpo-auth-flow">
			<div className="vulpo-auth-flow-dot"></div>
			<div className="vulpo-auth-flow-dot"></div>
			<div className="vulpo-auth-flow-dot"></div>
		</div>
	)
}