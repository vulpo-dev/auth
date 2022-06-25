import { useState, useEffect } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import dynamic from 'next/dynamic'

import styles from '../styles/Home.module.css'

let AuthExample = dynamic(() => import('../components/auth_memory'), {
  ssr: false,
})

let description = 'Vulpo Auth is a complete authentication solution for your single page application, it comes as a single binary that you can host anywhere and modular SDKs for you to create a unique authentication experiences.'

const Home: NextPage = () => {

  let [example, setExample] = useState<'ui' | 'code' | undefined>()
  useEffect(() => {
    if (example === undefined) {
      setExample('ui')
    }
  }, [example])

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

      <main className={styles.content}>
        <section className={`${styles.hero} ${styles.section}`}>
          <h1 className={styles['hero-title']}>
            Effortless Authentication for your Web Application.
          </h1>
          <a href="#get-started" className={`${styles['get-started']}`}>Get Started</a>
        </section>

        <section className={styles.section}>
          <header className={styles['demo-header']}>
            <h2 className={styles['demo-title']}>Demo: Drop-in UI</h2>

            <div className={styles['demo-buttons']}>
              <button
                className={`${styles['demo-button']} ${example === 'ui' ? styles['demo-button--active'] : ''}`}
                onClick={() => setExample('ui')}>
                UI
              </button>
              <button
                className={`${styles['demo-button']} ${example === 'code' ? styles['demo-button--active'] : ''}`}
                onClick={() => setExample('code')}>
                Code
              </button>
            </div>
          </header>
          <div suppressHydrationWarning={true}>
            { (example === 'ui') &&
              <div className={styles['ui-example-wrapper']}>
                <AuthExample />
              </div>
            }

            <div style={{ display: example === 'code' ? 'block' : 'none' }}>
              <pre>
                <code className="language-tsx">                  
                  { process.env.exampleCode }
                </code>
              </pre>
            </div>
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
