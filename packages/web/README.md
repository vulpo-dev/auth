# [Vulpo Auth](https://auth.vulpo.dev)

The client side web SDK's enable you to quickly integrate a complete
authentication solution, requiring minimal configuration.

The client SDK's are split up into three packages
1. The core TypeScript SDK
2. A React SDK
3. A prebuilt React UI

## Get Started with the prebuilt React UI

Before you start, make sure you have a local instance of the Vulpo auth server running. [Follow the instructions here](https://auth.vulpo.dev/#get-started)

Given a fresh instalation of create-react-app.

1. Install the package
```bash
npm install @vulpo-dev/auth-ui react-router-dom
```

2. Set up the client:
```
import React from 'react';
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

```

3. Update your App.js component to make use of the AuthShell:
```
import React from 'react'
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

```