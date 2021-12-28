import styled from 'styled-components'
import { BASELINE, BORDER_COLOR, WithClass, withClass } from '../utils'

export let Container = styled.div
	.attrs<WithClass>(withClass('vulpo-auth-container'))`
		display: flex;
		justify-content: center;
		align-items: center;
		inline-size: 100%;
		block-size: 100%;
	`

export let Section = styled.section
	.attrs<WithClass>(withClass('vulpo-auth-section'))`
		margin-block-end: calc(${BASELINE} * 2);
		display: flex;
		flex-direction: column;
	`

export let Footer = styled.footer
	.attrs<WithClass>(withClass('vulpo-auth-footer'))`
		text-align: center;
	`

export let Divider = styled.hr
	.attrs<WithClass>(withClass('vulpo-auth-divider'))`
		border: 0;
		height: 1px;
		width: 100%;
		margin-block-start: ${BASELINE};
		margin-block-end: calc(${BASELINE} * 1.625);
		background: ${BORDER_COLOR};
	`

export let LoadingWrapper = styled.div
	.attrs<WithClass>(withClass('vulpo-auth-loading-wrapper'))`
		display: flex;
		justify-content: center;
	`
