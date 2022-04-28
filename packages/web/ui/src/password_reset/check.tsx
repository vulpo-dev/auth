import React from 'react'
import { useQueryParams } from '@biotic-ui/std'
import { useLocation } from 'react-router-dom'

import { useTranslation } from '../context/translation'


export type Props = {
	email: string | null;
}

export let CheckReset = ({ email }: Props) => {
	let t = useTranslation()

	return (
		<div className="vulpo-auth vulpo-auth-card vulpo-auth-password-reset-check">
			<header className="vulpo-card-header">
				<h3 className="vulpo-auth-card-title">{t.reset_check_mail.title}</h3>
			</header>
			<t.reset_check_mail.description email={email} />
			<small>{t.reset_check_mail.info}</small>
		</div>
	)
}

let CheckResetContainer = () => {
	let location = useLocation()
	let params = useQueryParams(location.search)

	return (
		<CheckReset email={params.get('email')} />
	)
}

export default CheckResetContainer
