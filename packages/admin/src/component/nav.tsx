import styled from "@emotion/styled";
import { Gear, Key, UserSquare } from "@phosphor-icons/react";
import { NavLink } from "react-router-dom";

import adminApi from "../data/admin_api";
import { useActiveProject } from "../data/project";
import { usePrefetchAuthMethods } from "../pages/methods/methods";
import { usePrefetchSettings } from "../pages/settings/settings";

let Nav = () => {
	let project = useActiveProject();
	let prefetchUsers = adminApi.usePrefetch("getUsers");
	let prefetchAuthMethods = usePrefetchAuthMethods();
	let prefetchSettings = usePrefetchSettings();

	return (
		<Ul>
			<li onMouseEnter={() => prefetchUsers([{ project }])}>
				<NavItem to="users">
					<UserSquare size="1.2em" />
					<span>Users</span>
				</NavItem>
			</li>
			<li onMouseEnter={() => prefetchAuthMethods(project)}>
				<NavItem to="auth-methods">
					<Key size="1.2em" />
					<span>Auth Methods</span>
				</NavItem>
			</li>
			<li onMouseEnter={() => prefetchSettings(project)}>
				<NavItem to="settings">
					<Gear size="1.2em" />
					<span>Settings</span>
				</NavItem>
			</li>
		</Ul>
	);
};

export default Nav;

let Ul = styled.ul`
	margin: 0;
	list-style-type: none;
	padding: 0;
`;

let NavItem = styled(NavLink)`
	display: flex;
	align-items: center;
	gap: var(--size-3);
	color: var(--text-color);
	text-decoration: none;
	padding: var(--size-1) var(--_spacing-inline);
	font-weight: 700;

	&:hover {
		color: #fff;
		background: var(--brand--dark);
	}

	&.active {
		color: #fff;
		background: #000;
	}

`;
