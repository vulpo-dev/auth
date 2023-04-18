import styled from "@emotion/styled";
import { ReactNode } from "react";

export let Title = styled.h2`
	font-family: sans-serif;
	text-align: center;
`;

export let Body = styled.body`
	margin: 0;
	font-family: sans-serif;

	.bold {
		font-weight: bold;
	}
`;

type ContainerProps = {
	children?: ReactNode;
};

export let Container = ({ children }: ContainerProps) => {
	return (
		<StyledTable>
			<tbody>
				<tr>
					<td align="center">
						<StyledContentWrapper>
							<tbody>
								<tr>
									<td align="center">{children}</td>
								</tr>
							</tbody>
						</StyledContentWrapper>
					</td>
				</tr>
			</tbody>
		</StyledTable>
	);
};

export let StyledTable = styled.table`
	width: 100%;
	padding: 8px;
`;

export let StyledContentWrapper = styled.table`
	max-width: 600px;
	width: 100%;
	padding: 8px;
`;

type LinkProps = {
	href: string;
}

export let Link = ({ href }: LinkProps) => (
	<Text>
		<a href={href} target="_blank" >
			{href}
		</a>
	</Text>
)

export let Text = styled.p`
	text-align: center;
`