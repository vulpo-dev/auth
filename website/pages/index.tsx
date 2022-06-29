import type { NextPage } from 'next'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { ArrowBendLeftUp } from 'phosphor-react'

import styles from '../styles/Home.module.css'
import MockBrowser from '../components/mock_browser'
import HeaderNav from '../components/header_nav'
import Banner from '../components/banner'

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
        <HeaderNav />

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
            <span className='outlined'>Effortless</span>
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
                  <div className={styles['example-example']}>
                    <AuthExample />
                  </div>
                  <div className={styles['example-content-try']}>
                    <ArrowBendLeftUp size={40} />
                    <p>Try me</p>
                  </div>
                </div>
              </MockBrowser>
            </div>
          </div>

          <div className={styles['get-started-wrapper']}>
            <a className={styles['get-started']} href='/guides'>
              Quickstart Guide - 5min ⏱️
            </a>
          </div>
        </section>

        <section style={{ position: 'relative' }}>
            <Banner>
                <span>Open Source</span>
                <span>Open Source</span>
                <span>Open Source</span>
                <span>Open Source</span>
            </Banner>
        </section>

      </main>

      <footer className='footer'>
        <a href="https://riezler.co">riezler.co</a>
      </footer>
    </div>
  )
}

export default Home
