import App from './App'
import { Link } from 'react-router-dom'
import { AuthShell, Auth, PrivateRoute, PublicRoute } from '@riezler/auth-ui'
import { createContext, useContext, useState } from 'react'

let Bootstrap = () => {
	let [dark, setDark] = useState(false)

	return (
		<DarkMode.Provider value={{ dark, toggleDark: () => setDark(!dark)}}>
			<AuthShell name="VULPO" dark={dark} authscreen={<Authscreen />}>
				<PrivateRoute path='/page' element={<Page />} />
				<PrivateRoute path='/' element={<App />} />
				<PublicRoute path='/public' element={<PublicPage />} />
			</AuthShell>
		</DarkMode.Provider>
	)
}

export default Bootstrap

function Page() {
	return (
		<div className="test-private-page">
			<h1>Page</h1>
			<Link to="/">App</Link>
		</div>
	)
}

function PublicPage() {
	return (
		<div className="test-public-page">
			<h1>Public Page</h1>
			<Link className="test-goto-private" to="/page">Private Page</Link>
		</div>
	)
}

let DarkMode = createContext<{
	toggleDark: () => void,
	dark: boolean,
}>({
	toggleDark: () => {},
	dark: false,
})

let Authscreen = () => {
	let { toggleDark, dark } = useContext(DarkMode)

	return (
		<div className="authscreen">
			<header className="authscreen-header">
				<h2>VULPO Auth</h2>
				<button onClick={() => toggleDark()}>
					{ dark ? 'Light Mode' : 'Dark Mode'}
				</button>
			</header>
			<div className={`vulpo-auth vulpo-auth-container ${dark && 'authscreen-content--dark'}`}>
				<div className="vulpo-auth-box-shadow">
					<Auth />
				</div>
			</div>
		</div>
	)
}