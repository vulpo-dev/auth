import { useLocation } from 'react-router-dom'

import { useQueryParams } from '../utils'
import { useTranslation } from '../context/translation'
import Card from '../component/card'

export type Props = {
	email: string | null;
}

export let CheckReset = ({ email }: Props) => {
	let t = useTranslation()
	let e = email ? decodeURIComponent(email) : null

	return (
		<Card className="vulpo-auth-password-reset-check">
			<header className="vulpo-card-header">
				<h3 className="vulpo-auth-card-title">{t.reset_check_mail.title}</h3>
			</header>
			<t.reset_check_mail.description email={e} />
			<small>{t.reset_check_mail.info}</small>
		</Card>
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
