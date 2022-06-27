import Link from 'next/link'
import { useRouter } from 'next/router';

let HeaderNav = () => {
	let router = useRouter()
	let isHome = router.pathname === '/'

	return (
		<nav>
		  <span>v{ process.env.NEXT_PUBLIC_VERSION }</span>
		  
		  <section>
		  	{ !isHome && <Link href="/">Home</Link> }
		    <a href="/guides">Guides</a>
		    <a href="/docs/web/overview">Docs</a>
		    <a href="https://github.com/vulpo-dev/auth">Github</a>
		  </section>

		  <style jsx>{`
		  	nav {
		  		display: flex;
		  		justify-content: space-between;
		  		padding-top: max(1rem, 1vw);
		  		padding-bottom: max(0.75rem, 1vw);
		  		margin-bottom: max(0.75rem, 1vw);
		  		border-bottom: 3px solid #fff;
		  		margin-left: var(--page-padding-left);
		  		margin-right: var(--page-padding-right);
		  	}

		  	nav section {
				display: flex;
				column-gap: 1rem;
			}
		  `}</style>
		</nav>
	)
}

export default HeaderNav
