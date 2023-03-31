import styled from "@emotion/styled";
import {
	Password,
	AuthConfig,
	DefaultConfig,
	DefaultTranslation,
	FlagsCtx,
	Translation,
	SetPassword,
} from "@vulpo-dev/auth-ui";
import { Flag } from "@vulpo-dev/auth-sdk";
import { Navigate, Route, Routes } from "react-router-dom";
import "@vulpo-dev/auth-ui/styles.css";

export let AuthPage = () => {
	return (
		<PageWrapper>
			<FlagsCtx.Provider value={[Flag.EmailAndPassword]}>
				<Translation.Provider value={DefaultTranslation}>
					<AuthConfig.Provider value={DefaultConfig}>
						<AuthWrapper className="vulpo-auth-box-shadow">
							<Routes>
								<Route path='set_password' element={<SetPassword />} />
								<Route
									path='signin'
									element={<Password redirectTo='/auth/set_password' />}
								/>
								<Route path='/' element={<Navigate to='/auth/signin' />} />
							</Routes>
						</AuthWrapper>
					</AuthConfig.Provider>
				</Translation.Provider>
			</FlagsCtx.Provider>
		</PageWrapper>
	);
};

let PageWrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
`;

let AuthWrapper = styled.div`
	margin-top: calc(var(--size-8) * -1);
	color: var(--gray-8);

	a {
		color: var(--gray-7);
	}

	.vulpo-auth-password-input-button {
		--input-bg: none;
	}
`;
