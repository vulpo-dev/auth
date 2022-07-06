import { FunctionComponent, ReactNode } from 'react'
import { useConfig } from '../context/config'

type Props = {
	children: ReactNode,
	className?: string,
}

let Card: FunctionComponent<Props> = (props) => {
	let { dark } = useConfig()

	let classes = [
		'vulpo-auth vulpo-auth-card',
		props.className ?? '',
		dark && 'vulpo-auth--dark'
	]

	return (
		<div className={classes.join(' ')}>
			{ props.children }
		</div>
	)
}

export default Card
