import React from 'react'
import { FC, useState } from 'react'
import styled from 'styled-components'
import { useUsers, useTotalUsers } from 'data/user'
import { format } from 'data/date'
import { Wrapper, Header, Content, Row, UserId, Text } from 'component/user_table'
import { CaretLeft, CaretRight } from 'phosphor-react'
import { IconButton } from 'component/button'

type Props = {
	project: string;
}

let Users: FC<Props> = ({ project }) => {
	let limit = 25
	let [page, setPage] = useState<number>(0)

	let nextPage = (add: number) => () => {
		setPage(page => page + add)
	}

	let users = useUsers({ project, limit, offset: page + limit })
	let total = useTotalUsers(project)
	let pages = total.value ? Math.ceil(total.value / limit) : 0

	if (!users.items) {
		return null
	}

	return (
		<Container>
			<section>
				<h3>Users: { total?.value }</h3>
			</section>
			<Wrapper>
				<Header>
		            <span>Id</span>
		            <span>Email</span>
		            <span><Text align='right'>Verified</Text></span>
		            <span><Text align='right'>Created At</Text></span>
				</Header>
				<Content>
					{
						users.items.map(user => {
							return (
								<Row key={user.id}>
									<div>
										<UserId>{user.id}</UserId>
									</div>
									<div>
										<Text>{user.email}</Text>
									</div>
									<div>
										<Text align='right'>{user.email_verified ? 'Yes' : 'No'}</Text>
									</div>
									<div>
										<Text align='right'>{format(user.created_at)}</Text>
									</div>
								</Row>
							)
						})
					}
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