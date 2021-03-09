import React from 'react'
import { useMemo } from 'react'
import styled from 'styled-components'
import { useRouteMatch, Link } from 'react-router-dom'
import { useTranslation } from 'context/translation'
import { CardHeader, CardTitle } from 'component/card'
import { useFlags } from 'context/config'
import { Flag } from '@riezler/auth-sdk'

type Props = {
	title: string | null,
	info: string | null,
	link: string | null,
	to: string
}

export let Header = ({ title, info, link, to }: Props) => {
	return (
		<StyledHeader>
			{ title && <Title>{title}</Title>}
			{ info &&
				<Info>{info} { link && <Link to={`/${to}`}>{link}</Link>}</Info>
			}
		</StyledHeader>
	)
}

type Match = {
	type: string
} 

let HeaderContainer = () => {
	let match = useRouteMatch<Match>('/:type')
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


let Title = styled(CardTitle)`
	line-height: 1;
	margin-block-start: calc(var(--baseline) * -0.375);
	margin-block-end: calc(var(--baseline) * 1.75);
`

let StyledHeader = styled(CardHeader)`
	margin-block-end: calc(var(--baseline) * 4.125);
`

let Info = styled.p`
	margin-block-end: 0;
`

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

