import React from 'react'
import { useMemo } from 'react'
import { useMatch, Link } from 'react-router-dom'
import { Flag } from '@vulpo-dev/auth-sdk'

import { useTranslation } from '../context/translation'
import { useConfig, useFlags } from '../context/config'

type Props = {
	title: string | null,
	info: string | null,
	link: string | null,
	to: string
}

export let Header = ({ title, info, link, to }: Props) => {
	let { basename } = useConfig()
	return (
		<header className="vulpo-card-header vulpo-auth-header">
			{ title && <h3 className="vulpo-auth-card-title vulpo-auth-header-title">{title}</h3>}
			{ info &&
				<p className="vulpo-auth-header-info">
					{info} {' '} { link && <Link className="vulpo-auth-header-link" to={`/${basename}/${to}`}>{link}</Link>}
				</p>
			}
		</header>
	)
}
 

let HeaderContainer = () => {
	let { basename } = useConfig()
	let match = useMatch(`${basename}/:type/*`)
	let flags = useFlags()
	let type = match?.params?.type ?? ''

	let title = useTitle(type)
	let info = useInfo(type, flags)
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


function useInfo(type: string, flags: Array<Flag>): string | null {
	let t = useTranslation()
	return useMemo(() => {
		if (
			!flags.includes(Flag.SignIn) ||
			!flags.includes(Flag.SignUp)
		) {
			return null
		}

		switch(type) {
			case 'signin':
				return t.signup.info

			case 'signup':
				return t.signin.info

			default:
				return null
		}
	}, [t, type, flags])
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

