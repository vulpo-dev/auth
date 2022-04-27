import dynamic from 'next/dynamic';

let AuthExample = dynamic(() => import('../components/auth_example'), {
  ssr: false,
})

function AuthPage() {

	if (!process.browser) {
		return null
	}

	return (
		<div style={{ height: '100%' }} suppressHydrationWarning={true}>
			<AuthExample />
		</div>
	)
}

export default AuthPage