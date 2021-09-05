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
import {
	Wrapper,
	Header,
	Content,
	Text,
	GhostRows,
	Rows
} from 'component/user_table'
import {
	CaretLeft,
	CaretRight,
	ArrowClockwise,
	Trash,
	ClockClockwise,
	ArchiveBox,
	IdentificationCard
} from 'phosphor-react'
import { IconButton, CloseButton } from 'component/button'
import { Pulse } from '@biotic-ui/leptons'
import { SidebarLayout, Aside, Main } from '@biotic-ui/layout'
import { useWindowSize, useQueryParams, useOnEscape } from '@biotic-ui/std'
import { FloatingActionBar, ActionItem, ActionLabel } from 'component/floating_action_bar'
import Tooltip from 'component/tooltip'
import { useEmailSettings, hasEmailProvider } from 'data/settings'
import UserDetails from 'user/detail'
import { useHistory, useLocation } from 'react-router-dom'

type Props = {
	project: string;
}

let Users: FC<Props> = ({ project }) => {
	let history = useHistory()
	let location = useLocation()
	let params = useQueryParams(location.search)

	let { innerWidth } = useWindowSize()

	let [{ data: emailSettings }] = useEmailSettings(project)
	let hasEmail = hasEmailProvider(emailSettings)

	let deleteUser = useDeleteUser()
	let verifyEmail = useVerifyEmail(project)
	let disableUser = useDisableUser(project)

	let limit = 25
	let [page, setPage] = useState<number>(0)

	let nextPage = (add: number) => () => {
		setPage(page => page + add)
	}

	let [{ data: users, state }, actions] = useUsers({ project, limit, offset: page * limit })
	let [{ data: total }] = useTotalUsers(project)
	let pages = total ? Math.ceil(total / limit) : 0

	let [selected, setSelected] = useState<Array<string>>([])

	function handleSelect(id: string) {
		setSelected([id])
	}

	function handleOpen(userId: string) {
		history.push({
			...location,
			search: `?user=${userId}`
		})
	}

	function handleClose() {
		params.delete('user')
		history.push({
			...location,
			search: `?${params.toString()}`
		})
	}

	useOnEscape(() => {
		if (params.has('user')) {
			handleClose()
		}
	})

	let rows = users
		? <Rows
			items={users}
			onSelect={handleSelect}
			selected={selected}
			onOpen={handleOpen}
		/>
		: <GhostRows rows={limit} />


	async function handleDelete() {
		if (selected[0]) {
			await deleteUser(selected[0]!)

			if (params.get('user') === selected[0]) {
				handleClose()
			}

			actions.reload()
			setSelected([])
		}
	}

	async function handleVerify() {
		if (selected[0]) {
			await verifyEmail(selected[0]!)
			actions.reload()
			setSelected([])
		}
	}

	let user = users?.find(user =>  user.id === selected[0])
	async function handleDisable() {

		if (!users) {
			actions.reload()
			setSelected([])
			return
		}

		if (selected[0]) {
			await disableUser(selected[0]!, !user?.disabled)
			actions.reload()
			setSelected([])
		}
	}

	let isLoading = state === 'loading'

	return (
		<LayoutWrapper>
			<SidebarLayout right>
				<Aside drawer='(max-width: 900px)' open={params.has('user')} width={innerWidth * 0.3} onClose={handleClose}>						
					<CloseUserDetail>
						{ params.has('user') &&
							<StyledCloseButton>
								<CloseButton onClick={handleClose} />
							</StyledCloseButton>
						}
						
						<UserDetails 
							userId={params.get('user')}
						/>
					</CloseUserDetail>
				</Aside>
				<Main>	
					<Container>
						<HeaderInfo>
							<h3>Users: { total }</h3>
							<LoadingWrapper>
								{ isLoading && <Pulse /> }
								<Tooltip content='Reload' delay={[500, null]}>
									<IconButton onClick={() => actions.reload()}>
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
								<ActionLabel>{ user?.disabled ? 'Enable' : 'Disable' }Account</ActionLabel>
							</ActionItem>
							<ActionItem disabled={!hasEmail || true}>
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
				</Main>
			</SidebarLayout>
		</LayoutWrapper>
	)
}

export default Users

let LayoutWrapper = styled.div`
	height: 100%;
	overflow-x: hidden;

	aside {
		overflow: unset;
	}

	--aside-background: #222043;
`

let Container = styled.div`
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	padding-left: var(--baseline-2);
	padding-right: var(--baseline-5);

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

let CloseUserDetail = styled.div`
	position: relative;
`

let StyledCloseButton = styled.div`
	position: absolute;
	background: #fff;
	color: #000;
	border-radius: 100%;
	padding: calc(var(--baseline) / 2);
	left: calc(var(--baseline) * -1.5);
	top: var(--baseline);
	box-shadow: var(--shadow-2);

	svg {
		width: var(--baseline-2);
		height: var(--baseline-2);
	}
`