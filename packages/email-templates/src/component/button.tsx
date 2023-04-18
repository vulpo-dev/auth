import styled from "@emotion/styled";
import { cx, fallback } from "postler";
import { ReactNode } from "react";

let StyledButton = styled.table`
	box-sizing: border-box;
	width: 100%;

	& > tbody > tr > td {
		padding-bottom: 15px;
	}

	& table {
		width: auto;
	}

	& table td {
		background-color: #ffffff;
		border-radius: 5px;
		text-align: center;
	}

	& a {
		background-color: #ffffff;
		border: solid 1px #000;
		border-radius: 5px;
		box-sizing: border-box;
		color: #000;
		cursor: pointer;
		display: inline-block;
		font-size: 14px;
		font-weight: bold;
		margin: 0;
		padding: 12px 25px;
		text-decoration: none;
		text-transform: capitalize;
	}

	.btn-primary table td {
		background-color: #000;
	}

	.btn-primary a {
		background-color: #000;
		border-color: #000;
		color: #ffffff;
	}
`;

type Align = "center" | "left" | "right";

type Props = {
	children?: ReactNode;
	href?: string;
	primary?: boolean;
	align?: Align;
};

export let Button = (props: Props) => {
	return (
		<StyledButton
			role='presentation'
			border={0}
			cellPadding='0'
			cellSpacing='0'
		>
			<tbody className={cx({ "btn-primary": props.primary })}>
				<tr>
					<td align={fallback(props.align, "left") as Align}>
						<table
							role='presentation'
							border={0}
							cellPadding='0'
							cellSpacing='0'
						>
							<tbody>
								<tr>
									<td>
										<a href={props.href} target='_blank' rel="noreferrer">
											{props.children}
										</a>
									</td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>
			</tbody>
		</StyledButton>
	);
};
