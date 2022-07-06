import { FC, MouseEventHandler, ReactNode } from 'react'

type ButtonProps = {
	loading?: boolean,
	disabled?: boolean,
	outline?: boolean,
	id?: string,
	onClick?: MouseEventHandler<HTMLButtonElement>,
	'aria-label'?: string,
	className?: string,
	children?: ReactNode,
}

export let Button: FC<ButtonProps> = (props) => {
	let style = {
		['--size' as any]: '1em',
	}

	let classes = [
		'vulpo-auth-button',
		props.disabled ? 'vulpo-auth-button--disabled' : '',
		props.outline ? 'vulpo-auth-button--outline' : '',
	]

	return (
		<button
			className={`${classes.join(' ')} ${props.className ?? ''}`}
			disabled={props.loading || props.disabled}
			id={props.id}
			aria-label={props['aria-label']}
			onClick={props.onClick}
		>
			<span>
				{ props.loading && <div className="vulpo-auth-pulse" style={style} color='currentColor' /> }
				{ props.children }
			</span>
		</button>
	)
}

export let IconButton: FC<ButtonProps> = (props) => {
	let classes = [
		'vulpo-auth-icon-button',
		props.disabled ? 'vulpo-auth-button--disabled' : '',
		props.outline ? 'vulpo-auth-button--outline' : '',
	]

	return (
		<button
			id={props.id}
			aria-label={props['aria-label']}
			onClick={props.onClick}
			disabled={props.loading || props.disabled}
			className={`${classes.join(' ')} ${props.className ?? ''}`}
		>
			{props.children}
		</button>
	)
}