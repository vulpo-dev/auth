import React from 'react'
import { Fragment, FC, useMemo, useLayoutEffect, SyntheticEvent } from 'react'
import styled from 'styled-components'
import { Scrollbar } from '@biotic-ui/leptons'
import { GhostBar } from 'component/loading'
import { Users } from 'data/user'
import { format } from 'data/date'
import Tooltip from 'component/tooltip'
import Clipboard from 'clipboard'

export let Wrapper = styled.div`
	display: inline-grid;
	grid-template-rows: var(--baseline-5) auto;
	max-width: 1000px;
`

let columns = `
	width: 100%;
	grid-template-columns: calc(var(--baseline) * 12) 6fr 1fr 1.5fr;
	grid-column-gap: var(--baseline-2);
`

export let Header = styled.header`
	display: inline-grid;
	padding: 0 var(--baseline-3);
	padding-right: var(--baseline-4);
	${columns}

	> span {
		display: flex;
		align-items: center;
	}
`

export let Content = styled.div`
	height: 100%;
	overflow-y: scroll;
	overflow-x: hidden;
	background: #222043;
	padding: 0;
	border: 1px solid #000;
	--scrollbar-thumb: #000;
	${Scrollbar}
`

export let Row = styled.div<{ selected?: boolean }>`
	display: inline-grid;
	height: calc(var(--baseline) * 6);
	border: 1px solid #000;
	border-color: ${p => p.selected ? '#f0f' : '#000'};
	padding: 0 var(--baseline-3);

	${columns}

	> div {
		display: flex;
		align-items: center;
		overflow: hidden;
	}
`

type RowsPops = {
	items: Users;
	onSelect?: (u: string) => void; 
	selected?: Array<string>; 
	onOpen?: (u: string) => void;
}

export let Rows: FC<RowsPops> = ({
	items,
	onSelect = () => {},
	onOpen = () => {},
	selected = []
}) => {

	useLayoutEffect(() => {
		let clipboard = new Clipboard('.js-user-id', {
			// Not sure why, but it's broken without it
			target: function(trigger) {
		        return trigger;
		    }
		})
		return () => {
			clipboard.destroy()
		}
	}, [])

	let handleSelect = (userId: string) => (e: SyntheticEvent) => {
		let target = (e.target as HTMLElement)
		let isUserId = target.classList.contains('js-user-id')

		if (!isUserId) {
			onSelect(userId)
		}
 	}

	return (
		<Fragment>
			{
				items.map(user => {
					return (
						<Row
							key={user.id}
							onClick={handleSelect(user.id)}
							onDoubleClick={() => onOpen(user.id)}
							selected={selected.includes(user.id)}
						>
							<div>
								<Tooltip content={user.id}>
									<UserId
										className='js-user-id'
										data-clipboard-target={user.id}>
										{user.id}
									</UserId>
								</Tooltip>
							</div>
							<div>
								<Text>{user.email}</Text>
							</div>
							<div>
								<Text align='right'>{user.email_verified ? 'Yes' : 'No'}</Text>
							</div>
							<div>
								<Tooltip content={user.created_at.toISOString()}>
									<Text align='right'>{format(user.created_at)}</Text>
								</Tooltip>
							</div>
						</Row>
					)
				})
			}
		</Fragment>
	)
}

type GhostRowsProps = {
	rows?: number;
}

export let GhostRows: FC<GhostRowsProps> = ({ rows = 25 }) => {

	let items = useMemo(() => {
		return Array(rows).fill(null)
	}, [rows])

	return (
		<Fragment>
			{ items.map((_, index) => {
				return (
					<Row key={index}>
						<div>
							<GhostBar height='16px' />
						</div>
						<div>
							<GhostBar height='16px' />
						</div>
						<div>
							<GhostBar height='16px' />
						</div>
						<div>
							<GhostBar height='16px' />
						</div>
					</Row>
				)
			})}
		</Fragment>
	)
}

export let UserId = styled.span`
	display: block;
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
	cursor: pointer;
`

export let Text = styled.span<{ align?: 'left' | 'right' }>`
	text-align: ${p => p.align ? p.align : 'left'};
	display: block;
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
	width: 100%;
`