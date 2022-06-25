import type { NextPage } from 'next'
import Head from 'next/head'
import dynamic from 'next/dynamic'

import styles from '../styles/Home.module.css'

import MockBrowser from '../components/mock_browser'

let AuthExample = dynamic(() => import('../components/auth_memory'), {
  ssr: false,
})

let description = 'Vulpo Auth is a complete authentication solution for your single page application, it comes as a single binary that you can host anywhere and modular SDKs for you to create a unique authentication experiences.'

const Home: NextPage = () => {

  return (
    <div>
      <Head>
        <title>Vulpo Auth</title>
        <meta name="description" content={description} />
      </Head>

      <header className={styles.header}>
        <nav className={styles['header-nav']}>
          <span>v{ process.env.NEXT_PUBLIC_VERSION }</span>
          
          <section>
            <a href="/docs/guides">Guides</a>
            <a href="/docs/web/overview">Docs</a>
            <a href="https://github.com/vulpo-dev/auth">Github</a>
          </section>
        </nav>

        <div className={styles['header-bottom']}>
          <h2 className={styles.name}>Vulpo Auth</h2>
          <p className={styles['header-info']}>
            { description }
          </p>
        </div>
      </header>

      <main>
        <section className={`${styles.section} ${styles.hero} `}>
          <h1 className={styles['hero-title']}>
            <span className={styles.outlined}>Effortless</span>
            <span>Authentication</span>
            <small>for your Web Application.</small>
          </h1>
        </section>

        <section className={`${styles.section} ${styles['demo-section']}`}>
          <div className={styles.demo}>
            <pre className={styles['demo-code']} suppressHydrationWarning={true}>
              <code className="language-tsx">                  
                { process.env.exampleCode }
              </code>
            </pre>
            
            <div className={styles['ui-example-wrapper']}>
              <MockBrowser>
                <div className={styles['example-content']}>
                  <AuthExample />
                </div>
              </MockBrowser>
            </div>
          </div>

          <div className={styles['get-started-wrapper']}>
            <a className={styles['get-started']} href='/guides/quickstart'>
              Get Started: 5 minute Quickstart {'>'}
            </a>
          </div>
        </section>

      </main>

      <footer className='footer'>
        <a href="https://riezler.co">riezler.co</a>
      </footer>
    </div>
  )
}

export default Home
