import dynamic from 'next/dynamic'
import Head from 'next/head'

import HeaderNav from '../components/header_nav'

let AuthExample = dynamic(() => import('../components/auth_page'), {
  ssr: false,
})

function AuthPage() {
	return (
		<div style={{ height: '100%' }} suppressHydrationWarning={true}>
			<Head>
				<title>UI Demo - Vulpo Auth</title>
			</Head>
			<header>
				<HeaderNav />
			</header>
			<div style={{ maxWidth: 600, margin: '0 auto' }}>
				<AuthExample />
			</div>
		</div>
	)
}

export default AuthPage