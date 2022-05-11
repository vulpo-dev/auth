import React, { FunctionComponent } from 'react'
import { Flow } from './loading'

type Props = {
	name?: string;
	background?: string;
}

let Splashscreen: FunctionComponent<Props> = (props) => {

	let style = {
		background: props.background ?? '#fff'
	} as React.CSSProperties

	return (
		<div style={style} className="vulpo-auth vulpo-auth-splashscreen">
			{ props.name && <h1 className="vulpo-auth-splashscreen-title">{ props.name }</h1> }
			<Flow />
		</div>
	)
}

export default Splashscreen
