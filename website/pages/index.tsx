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

        <meta property="og:title" content='Effortless Authentication - Vulpo Auth' />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://auth.vulpo.dev" />
        <meta property="description" content={description} />
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

        <section style={{ position: 'relative', marginBottom: 'max(10vw, 5rem)' }}>
          <a href='https://github.com/vulpo-dev/auth/' style={{ textDecoration: 'none' }}>    
            <Banner>
                <span>Open Source</span>
                <span>Open Source</span>
                <span>Open Source</span>
                <span>Open Source</span>
            </Banner>
          </a>
        </section>

        <section className={`${styles.section}`}>
          <h2 className={styles['section-header']}>Roadmap</h2>
          <ul className={styles['features']}>
            <Feature title='Email Password Authentication' status='complete' />
            <Feature title='Reset Password' status='complete' />
            <Feature title='Verify Email' status='complete' />
            <Feature title='Passwordless Authentication' status='complete' />
            <Feature title='Sign in with Google' status='complete' />
            <Feature title='Multiple Projects' status='complete' />
            <Feature title='Email Internationalization' status='complete' />
            <Feature title='Pre-built React UI' status='complete' />
            <Feature title='Admin Dashboard' status='complete' />
            <Feature title='API Keys' status='complete' />
            <Feature title='Update Users Email' status='complete' />
            <Feature title='Attribute Based Access Control' status='in_progress' />
            <Feature title='Pre-built Vue and Angular UI' status='planned' />
            <Feature title='Two Factor Authentication' status='planned' />
            <Feature title='Advanced User Management' status='planned' />
            <Feature title='Support next.js and remix' status='planned' />
            <Feature title='Server-side Admin SDKs' status='planned' />
            <Feature title='Support for iOS and Android ' status='planned' />
            <Feature title='Role Based Access Control ' status='planned' />
          </ul>

          <a href='https://github.com/vulpo-dev/auth/issues'>
            Are you looking for specific feature?
          </a>
        </section>

      </main>

      <footer className='footer'>
        <a href="https://riezler.co">riezler.co</a>
      </footer>
    </div>
  )
}

export default Home


type FeatureProps = {
  title: string;
  status: 'complete' | 'in_progress' | 'planned'
}

let Feature = ({ title, status }: FeatureProps) => {

  let _status = status === 'complete'
    ? 'Complete'
    : status === 'in_progress'
    ? 'In Progress'
    : 'Planned'

  return (
    <>
      <li>{title} <span className={status}>{_status}</span></li>
      <style jsx>{`
        li {
          font-size: 1.5rem;
          font-size: max(1rem, 2.5vw);
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #888;
          padding-bottom: 1rem;
          margin-bottom: 1rem;
        }

        li span {
          font-size: 0.8em;
        }

        .complete {
          color: #38b300;
        }

        .in_progress {
          color: #b77600;
        }

        .planned {
          color: #646464;
        }
      `}</style>
    </>
  )
}