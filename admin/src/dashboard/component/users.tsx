import React from 'react'
import { FC, useState } from 'react'
import styled from 'styled-components'
import {
	useUsers,
	useTotalUsers,
	useDeleteUser,
	useVerifyEmail,
	useDisableUser,
} from 'data/user'
import { format } from 'data/date'
import { Wrapper, Header, Content, Text, GhostRows, Rows } from 'component/user_table'
import {
	CaretLeft,
	CaretRight,
	ArrowClockwise,
	Trash,
	ClockClockwise,
	ArchiveBox,
	IdentificationCard
} from 'phosphor-react'
import { IconButton } from 'component/button'
import { Pulse } from '@biotic-ui/leptons'
import { FloatingActionBar, ActionItem, ActionLabel } from 'component/floating_action_bar'
import Tooltip from 'component/tooltip'
import { useEmailSettings, hasEmailProvider } from 'data/settings'

type Props = {
	project: string;
}

let Users: FC<Props> = ({ project }) => {
	let [{ initialData }] = useEmailSettings(project)
	let hasEmail = hasEmailProvider(initialData)

	let deleteUser = useDeleteUser()
	let verifyEmail = useVerifyEmail(project)
	let disableUser = useDisableUser(project)

	let limit = 25
	let [page, setPage] = useState<number>(0)

	let nextPage = (add: number) => () => {
		setPage(page => page + add)
	}

	let users = useUsers({ project, limit, offset: page * limit })
	let total = useTotalUsers(project)
	let pages = total.value ? Math.ceil(total.value / limit) : 0

	let [selected, setSelected] = useState<Array<string>>([])

	function handleSelect(id: string) {
		setSelected([id])
	}

	let rows = users.items
		? <Rows items={users.items} onSelect={handleSelect} selected={selected} />
		: <GhostRows rows={limit} />


	async function handleDelete() {
		if (selected[0]) {
			await deleteUser.run(selected[0]!)
			users.reload()
			setSelected([])
		}
	}

	async function handleVerify() {
		if (selected[0]) {
			await verifyEmail.run(selected[0]!)
			users.reload()
			setSelected([])
		}
	}

	let user = users.items?.find(user =>  user.id === selected[0])
	async function handleDisable() {

		if (!users.items) {
			users.reload()
			setSelected([])
			return
		}

		if (selected[0]) {
			await disableUser.run(selected[0]!, !user?.disabled)
			users.reload()
			setSelected([])
		}
	}

	return (
		<Container>
			<HeaderInfo>
				<h3>Users: { total?.value }</h3>
				<LoadingWrapper>
					{ users.loading && <Pulse /> }
					<Tooltip content='Reload' delay={[500, null]}>
						<IconButton onClick={users.reload}>
							<ArrowClockwise size={20} weight='bold' />
						</IconButton>
					</Tooltip>
				</LoadingWrapper>
			</HeaderInfo>
			<Wrapper>
				<Header>
		            <span>User ID</span>
		            <span>Email</span>
		            <span><Text align='right'>Verified</Text></span>
		            <span><Text align='right'>Created At</Text></span>
				</Header>
				<Content>
					{ rows }
				</Content>
			</Wrapper>
			<Footer>
				<div></div>
				<Pagination>
					<span>{page + 1} / { pages }</span>
				</Pagination>
				<Buttons>
					<IconButton
						onClick={nextPage(-1)}
						disabled={page <= 0}
					>
						<CaretLeft size={24} />
					</IconButton>
					<IconButton
						onClick={nextPage(1)}
						style={{ justifyContent: 'flex-end' }}
						disabled={(page + 1) >= pages}
					>
						<CaretRight size={24} />
					</IconButton>
				</Buttons>
			</Footer>

			<FloatingActionBar open={selected.length > 0} onClose={() => setSelected([])}>
				<ActionItem onClick={handleDisable}>
					<ArchiveBox weight='bold' size={24} />
					<ActionLabel>{ user?.disabled ? 'Enable' : 'Disable' } Account</ActionLabel>
				</ActionItem>
				<ActionItem disabled={!hasEmail}>
					<ClockClockwise weight='bold' size={24} />
					<ActionLabel>Reset Password</ActionLabel>
				</ActionItem>
				<ActionItem onClick={handleVerify} disabled={!hasEmail}>
					<IdentificationCard weight='bold' size={24} />
					<ActionLabel>Send Email Verification</ActionLabel>
				</ActionItem>
				<ActionItem onClick={handleDelete}>
					<Trash weight='bold' size={24} />
					<ActionLabel>Delete</ActionLabel>
				</ActionItem>
			</FloatingActionBar>
		</Container>
	)
}

export default Users

let Container = styled.div`
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;

	${Wrapper} {
		height: 80%;
		margin-bottom: var(--baseline-5);
	}
`

let Footer = styled.section`
	display: inline-grid;
	grid-template-columns: 1fr 1fr 1fr;
	width: 1000px;
`

let Buttons = styled.div`
	display: flex;
	justify-content: flex-end;
	align-items: center;

	${IconButton} {
		width: var(--baseline-4);
	}
`

let Pagination = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
`

let HeaderInfo = styled.section`
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
	max-width: 1000px;
	margin-bottom: var(--baseline-5);

	h3 {
		margin-bottom: 0;
	}
`

let LoadingWrapper = styled.div`
	display: flex;
`