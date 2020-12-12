import React from 'react'
import { useMemo } from 'react'
import { useRouteMatch, Link } from 'react-router-dom'
import { useTranslation } from 'context/translation'

type Props = {
	title: string | null,
	info: string | null,
	link: string | null,
	to: string
}

export let Header = ({ title, info, link, to }: Props) => {
	return (
		<header>
			{ title && <h3>{title}</h3>}
			{ info &&
				<p>{info} { link && <Link to={`/${to}`}>{link}</Link>}</p>
			}
		</header>
	)
}

type Match = {
	type: string
} 

let HeaderContainer = () => {
	let match = useRouteMatch<Match>('/:type')

	let type = match?.params?.type ?? ''

	let title = useTitle(type)
	let info = useInfo(type)
	let link = useLink(type)
	let to = useTo(type)

	return <Header
		title={title}
		info={info}
		link={link}
		to={to}
	/>
}

export default HeaderContainer


function useTitle(type: string): string | null {
	let t = useTranslation()
	return useMemo(() => {
		switch(type) {
			case 'signin':
				return t.signin.title

			case 'signup':
				return t.signup.title

			default:
				return null
		}
	}, [t, type])
}


function useInfo(type: string): string | null {
	let t = useTranslation()
	return useMemo(() => {
		switch(type) {
			case 'signin':
				return t.signup.info

			case 'signup':
				return t.signin.info

			default:
				return null
		}
	}, [t, type])
}

function useLink(type: string): string | null {
	let t = useTranslation()
	return useMemo(() => {
		switch(type) {
			case 'signin':
				return t.signup.label

			case 'signup':
				return t.signin.label

			default:
				return null
		}
	}, [t, type])
}

function useTo(type: string): string {
	return useMemo(() =>{
		switch(type) {
			case 'signin':
				return 'signup'

			case 'signup':
				return 'signin'

			default:
				return ''
		}
	}, [type])
}