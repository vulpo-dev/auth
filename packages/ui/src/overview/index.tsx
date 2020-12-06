import styled from 'styled-components'
import { Card } from 'component/card'
import { OutlineButton, Button } from '@biotic-ui/button'
import Header from 'component/header'
import { Link } from 'react-router-dom'
import { useTranslation } from 'context/translation'

export let Overview = () => {
	let t = useTranslation()
	return (
		<Card>
			<Header />
			<LinkButton as={Link} to='/signin/link'>
				{t.email.label}
			</LinkButton>
			<OutlineButton as={Link} to='/signin/email'>
				{t.password.label}
			</OutlineButton>
		</Card>
	)
}

let LinkButton = styled(Button)`
	margin-bottom: var(--baseline);
`