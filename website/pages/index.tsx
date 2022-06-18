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
          <a href="https://github.com/riezler-co/auth">Github</a>
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

        <section className={`${styles['set-up']} ${styles.section}`} id="get-started">
          <h2>Get Started</h2>

          <section>
            <h3>Server Set-up: Docker</h3>
              <ol>
                <li>
                  <details>
                    <summary>docker-compose for local development</summary>
                    
                    <pre>
                      <code className="language-yaml">
{`version: '2'
services:
  postgres:
    image: postgres
    container_name: vulpo_pg
    restart: always
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_USER: postgres
    ports:
      - 5432:5432
    volumes:
      - postgres-data:/var/lib/postgres

  mailhog:
    image: mailhog/mailhog
    container_name: vulpo_mailhog
    restart: always
    ports:
      - 1025:1025
      - 8025:8025
    volumes:
      - mailhog-data:/var/lib/mailhog
  vulpo:
    image: riezler/vulpo_auth
    container_name: vulpo_auth_server
    restart: always
    environment:
      - VULPO_SECRETS_PASSPHRASE=password
      - VULPO_DB_PORT=5432
      - VULPO_DB_USERNAME=postgres
      - VULPO_DB_PASSWORD=postgres
      - VULPO_DB_LOG_LEVEL=Off
      - VULPO_DB_HOST=vulpo_pg
      - VULPO_DB_DATABASE_NAME=auth
      
      
      # this should only be used for local development
      # in production you should run migrations separatly
      # before you run your container
      - VULPO_RUN_MIGRATIONS=true
      
      # this will use an insecure smtp connection and should
      # only be used for local development
      - VULPO_MAIL_LOCALHOST=vulpo_mailhog
    
    ports:
      - 8000:8000
    depends_on:
      - postgres
      - mailhog
volumes:
  postgres-data:
  mailhog-data:
`}
                      </code>
                    </pre>
                  </details>
                </li>

                <li>Go to <a href="http://localhost:8000" target="_blank" rel="noreferrer">localhost:8000</a> and finish the set up process</li>
              </ol>
          </section>

          <section>
            <h3>Client Set-up</h3>

            <ol>
              <li>
                Enable Email and Password Sign In/Up

                <ul>
                  <li>Go to the admin dashboard</li>
                  <li>Got to your project → Sign In Methods</li>
                  <li>Select Sign In, Sign Up and Email and Password</li>
                </ul>
              </li>

              <li>
                <details>
                  <summary>Create a new React project: <a href="https://reactjs.org/docs/create-a-new-react-app.html" target="_blank" rel="noreferrer">https://reactjs.org/docs/create-a-new-react-app.html</a></summary>
                  <pre>
                    <code>
                      
{`npx create-react-app my-app
cd my-app
npm start
`}
                    </code>
                  </pre>
                </details>
              </li>

              <li>
                <details>
                  <summary>Install the vulpo auth packages</summary>
                  <pre>npm install @vulpo-dev/auth-ui react-router-dom</pre>
                </details>
              </li>

              <li>
                <details>
                  <summary>Setup the Auth Client:</summary>
                  <pre>
                    <code className="language-tsx">
{`import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom'
import { Auth as AuthCtx } from '@vulpo-dev/auth-react'
import { Auth } from '@vulpo-dev/auth-sdk'
import '@vulpo-dev/auth-ui/styles.css'

let AuthClient = Auth.create({
  // You'll find the ID under your project settings
  project: '<project-id>',
  baseURL: 'http://127.0.0.1:8000'
})

let container = document.getElementById('root')
let root = createRoot(container) // createRoot(container!) if you use TypeScript

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthCtx.Provider value={AuthClient}>
        <App />
      </AuthCtx.Provider>
    </BrowserRouter>
  </React.StrictMode>
);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
`}
                    </code>
                  </pre>
                </details>
              </li>

              <li>
                <details>
                  <summary>Update your App.js component to make use of the AuthShell</summary>
                  <pre>
                    <code className="language-tsx">
{`import React from 'react'
import { Route, Link } from 'react-router-dom'
import { AuthShell, useUser } from '@vulpo-dev/auth-ui'

let App = () => {
        return (
                <AuthShell>
                        <Route path='/' element={<WithUser />} />
                        <Route path='page' element={
                          <div>
                                  <h1>Page</h1>
                                  <Link to="/">Page</Link>
                          </div>
                        } />
                </AuthShell>
        )
}
export default App

let WithUser = () => {
    let user = useUser()
    return (
        <div>
  
          <h1>With User </h1>
            <Link to="page">Page</Link>
            <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
    )
}
`}
                    </code>
                  </pre>
                </details>
              </li>
            </ol>
          </section>

          <section>
            <h3>Making API Calls</h3>
            <pre>
              <code className="language-tsx">
{`// App.js
import { useUser, useAuth } from '@vulpo-dev/auth-react'

let WithUser = () => {
   let user = useUser()
   let auth = useAuth()
   
   async function callApi() {
    try {
      let res = await auth.withToken((token: string) => {
        return fetch('your.api-server.com', {
          headers: {
            'Authorization': \`Bearer \${token}\`,
          }
        })
      })
      console.log(await res.text())
    } catch(err) {
      console.log({ err })
    }
  }
   
   return (
        <div>
            <h1>With User </h1>
            <Link to="/">Page</Link>
            <button onClick={callApi}>Call API</button>
            <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
    )
}
`}
              </code>
            </pre>
          </section>

        </section>

        <section>
          <h2>Config</h2>

          <section>
            <h3>Environment Variables</h3>

            <dl>
              <dt>VULPO_SECRETS_PASSPHRASE</dt>
              <dd>
                <ul>
                  <li>Required</li>
                </ul>
              </dd>

              <dt>VULPO_DB_PORT</dt>
              <dd>
                <ul>
                  <li>Default: 5432</li>
                </ul>
              </dd>

              <dt>VULPO_DB_USERNAME</dt>
              <dd>
                <ul>
                  <li>Default: postgres</li>
                </ul>
              </dd>
              
              <dt>VULPO_DB_PASSWORD</dt>
              <dd>
                <ul>
                  <li>Default: postgres</li>
                </ul>
              </dd>
              
              <dt>VULPO_DB_LOG_LEVEL</dt>
              <dd>
                <ul>
                  <li>Required</li>
                  <li>Values: Off | Error | Warn | Info | Debug | Trace</li>
                </ul>
              </dd>
              
              <dt>VULPO_DB_HOST</dt>
              <dd>
                <ul>
                  <li>Default: localhost</li>
                </ul>
              </dd>
              
              <dt>VULPO_DB_DATABASE_NAME</dt>
              <dd>
                <ul>
                  <li>Default: auth</li>
                </ul>
              </dd>
              
              <dt>VULPO_RUN_MIGRATIONS</dt>
              <dd>
                <ul>
                  <li>Will run migrations on start up when the variable is present</li>
                </ul>
              </dd>
              
              <dt>VULPO_MAIL_LOCALHOST</dt>
              <dd>
                <ul>
                  <li>When Email host is equal to localhost, an insecure SMTP connection will be used, you can use this variable to overwrite the local email host</li>
                </ul>
              </dd>
              
              <dt>VULPO_SERVER_*</dt>
              <dd>
                <ul>
                  <li>Vulpo Auth is using <a href="https://rocket.rs/">Rocket</a> for the web framework and thus environment variables with the VULPO_SERVER_ prefix will use the same configuration options as Rocket</li>
                  <li>You have to replace the ROCKET_ prefix with the VULPO_SERVER_ <a href="prefix https://rocket.rs/v0.5-rc/guide/configuration/#environment-variables">prefix https://rocket.rs/v0.5-rc/guide/configuration/#environment-variables</a></li>
                </ul>
              </dd>
            </dl>
          </section>

          <section>
            <h3>Vulpo.toml</h3>
            <pre>
              <code className="language-toml">{`## rocket server config: https://rocket.rs/v0.5-rc/guide/configuration/#rockettoml
[server]
address = "127.0.0.1"
port = 8000
workers = 16
keep_alive = 5
ident = "Rocket"
log_level = "normal"
cli_colors = true

[secrets]
## NOTE: Generate your own secure key!
passphrase = "password"

[database]
host = "localhost"
database_name = "auth"
username = "postgres"
password = "postgres"
port = 5432
log_level = "Off"`}</code>
            </pre>
          </section>
        </section>
      </main>

      <footer className='footer'>
        <a href="https://riezler.co">riezler.co</a>
      </footer>
    </div>
  )
}

export default Home
