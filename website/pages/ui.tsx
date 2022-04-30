import dynamic from 'next/dynamic'
import Head from 'next/head'

let AuthExample = dynamic(() => import('../components/auth_page'), {
  ssr: false,
})

function AuthPage() {
	return (
		<div style={{ height: '100%' }} suppressHydrationWarning={true}>
			<Head>
				<title>UI Demo - Vulpo Auth</title>
			</Head>
			<AuthExample />
		</div>
	)
}

export default AuthPage