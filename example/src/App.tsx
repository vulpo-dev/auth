import { FormEvent, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { useAuth } from '@vulpo-dev/auth-react'
import { Link } from 'react-router-dom'
import { ErrorCode } from '@vulpo-dev/auth-sdk';

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
    <div>
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
    </div>
  )
}