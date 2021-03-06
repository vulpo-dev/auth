import React from 'react';
import logo from './logo.svg';
import './App.css';
import { useAuth } from '@riezler/auth-react'
import { Link } from 'react-router-dom'

function App() {
  let auth = useAuth()
  
  function signOut() {
    auth.signOut().catch((err: unknown) => {
      console.log(err)
    })
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
      </header>

      <button className="signOut" onClick={signOut}>Sign Out</button>
    </div>
  );
}

export default App;
