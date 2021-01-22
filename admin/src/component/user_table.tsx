import styled from 'styled-components'
import { Scrollbar } from '@biotic-ui/leptons'

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
	border: 2px solid #000;
	--scrollbar-thumb: #000;
	${Scrollbar}
`

export let Row = styled.div`
	display: inline-grid;
	height: calc(var(--baseline) * 6);
	border-bottom: 2px solid #000;
	padding: 0 var(--baseline-3);

	${columns}

	> div {
		display: flex;
		align-items: center;
		overflow: hidden;
	}
`

export let UserId = styled.span`
	display: block;
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
`

export let Text = styled.span<{ align?: 'left' | 'right' }>`
	text-align: ${p => p.align ? p.align : 'left'};
	display: block;
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
	width: 100%;
`