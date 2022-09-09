import { FormEvent, useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { useAuth } from '@vulpo-dev/auth-react'
import { Link } from 'react-router-dom'
import { ErrorCode, uuid, ApiKeys } from '@vulpo-dev/auth-sdk';

function App() {
  let auth = useAuth()
  
  function signOut() {
    auth.signOut().catch((err: unknown) => {
      console.log(err)
    })
  }

  async function callApi() {
    try {
      let res = await auth.withToken((token: string) => {
        return fetch('http://127.0.0.1:8001', {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        })
      })

      console.log(await res.json())
    } catch(err) {
      console.log({ err })
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <Link className="App-link" to="/page">
          Page
        </Link>
        <button onClick={callApi}>
          Call Api
        </button>
      </header>

      <main>
        <EmailForm />
        <ApiKeyForm />
      </main>

      <button className="signOut" onClick={signOut}>Sign Out</button>
    </div>
  );
}

export default App;


let EmailForm = () => {
  let auth = useAuth()

  let [loading, setLoading] = useState(false)
  let [submitted, setSubmitted] = useState(false)
  let [error, setError] = useState<ErrorCode | null>(null)

  async function handleUpdateEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    console.log(e.currentTarget)
    let data = new FormData(e.currentTarget)
    let email = data.get('new_email')

    if (!email || email.toString().trim() === '') {
      return
    }

    setLoading(true)
    auth.updateEmail(email.toString().trim())
      .then(() => setSubmitted(true))
      .catch(err => setError(err.code))
      .finally(() => setLoading(false))
  }

  return (
    <section>
      { error !== null &&
        <p>{ error }</p>
      }

      { submitted && 
        <p className='update-email--submitted'>Check your emails to finish the change</p>
      }

      <form onSubmit={handleUpdateEmail}>
        <label>New Email</label>
        <input name='new_email' type='email' />
        <button disabled={loading}>Update Email</button>
      </form>
    </section>
  )
}

let ApiKeyForm = () => {
  let auth = useAuth()

  let [apiKey, setApiKey] = useState('')
  let [loading, setLoading] = useState(false)
  let [submitted, setSubmitted] = useState(false)
  let [error, setError] = useState<ErrorCode | null>(null)

  async function generateApiKey() {
    setLoading(true)

    auth
      .generateApiKey({ name: uuid() })
      .then((apiKey) => {
        setSubmitted(true)
        setApiKey(apiKey)
      })
      .catch(err => setError(err.code))
      .finally(() => setLoading(false))
  }

  let [{ keys }, setKeys] = useState<ApiKeys>({ keys: [] })
  useEffect(() => {
    let controller = new AbortController()

    auth
      .listApiKeys({ signal: controller.signal })
      .then(res => setKeys(res))
      .catch(() => {})

    return () => controller.abort()
  }, [auth, apiKey])

  return (
    <section>
      
      <div>
        
        <button onClick={generateApiKey} disabled={loading}>
          Generate API Key
        </button>

        { (submitted && !error) &&
          <div>
            <h3>Generated Key</h3>
            <p className='generated_api_key'>{apiKey}</p>
          </div>
        }      

        <div>
          <h3>Api Keys</h3>
          <table className='api_keys'>
            <thead>
              <tr>
                <th align='left'>Id</th>
                <th align='left'>Name</th>
                <th align='left'>Created At</th>
                <th align='left'>Expire At</th>
              </tr>
            </thead>

            <tbody>
              { keys.map(key => {
                return (
                  <tr key={key.id}>
                    <td><span>{ key.id }</span></td>
                    <td><span>{ key.name }</span></td>
                    <td>{ key.created_at }</td>
                    <td>{ key.expire_at }</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}