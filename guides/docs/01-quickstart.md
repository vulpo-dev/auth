# Quickstart

## Set up the Authentication server

In order to quickly get everything up and running locally, we'll use docker compose[^1]. 

1. create a `docker-compose.yml` file in your project directory

2. Copy and paste the configuration below. Our compose file contains three services:
	- Postgres[^2] - Our main data store.
	- MailHog[^3] - Used for local development, mailhog.
	- Vulpo Auth - The authentication server.
```yaml
version: '2'
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
```

3. Go to <a href="http://localhost:8000" target="_blank" rel="noreferrer">localhost:8000</a> and finish the set up process


## Client Set-up

1. Enable Email and Password Sign In/Up
	- Go to the admin dashboard
	- Got to your project → Sign In Methods
	- Select Sign In, Sign Up and Email and Password

2. Create a new React[^4] project: [Create React App](https://create-react-app.dev/)
```bash
npx create-react-app my-app
cd my-app
npm start
```

3. Install the vulpo auth packages
```bash
npm install @vulpo-dev/auth-ui react-router-dom
```

4. Setup the Auth Client:
```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom'

// The Vulpo Auth packages
import { Auth as AuthCtx } from '@vulpo-dev/auth-react'
import { Auth } from '@vulpo-dev/auth-sdk'
import '@vulpo-dev/auth-ui/styles.css' // Default styles

let AuthClient = Auth.create({
  // Got to localhost:8000 -> Your Project -> Settings
  project: '<project-id>',
  baseURL: 'http://localhost:8000'
})

let container = document.getElementById('root')
let root = createRoot(container) // createRoot(container!) if you use TypeScript

root.render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Wrap your application inside the Auth Context */}
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

5. Update your App.js component to make use of the AuthShell
```jsx
import React from 'react'
import { Route, Link } from 'react-router-dom'
import {
	AuthShell,
	useUser,
	PrivateRoute,
	PublicRoute
} from '@vulpo-dev/auth-ui'

let App = () => {
    return (
        <AuthShell>
           {/* Routes are by default private */}
           <Route path='private' element={<WithUser />} />

           {/* You can also be more explicit */}
           <PrivateRoute path='user' element={<WithUser />} />

           {/* A PublicRoute will be accessible by everyone */}
           <PublicRoute path='/' element={
             <div>
               <h1>Public Page</h1>
               <Link to="private">Private Route: Route</Link>
               <Link to="user">Private Route: PrivateRoute</Link>
             </div>
            }/>
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
6. Congrats, you have completed the set up!


## Making API Calls
The web SDK provides a `withToken` method that manages your token life cycle.
Given the `WithUser` component we have set up in the previous step, import the `withAuth` hook to get access to the web SDK.
```jsx
import { useUser, useAuth } from '@vulpo-dev/auth-react'

let WithUser = () => {
   let user = useUser()
   let auth = useAuth()
   
   async function callApi() {
    try {
      let res = await auth.withToken((token) => {
        return fetch('your.api-server.com', {
          headers: {
            'Authorization': `Bearer ${token}`,
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
            <Link to="page">Page</Link>
            <button onClick={callApi}>Call API</button>
            <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
    )
}
```

All that's left to do is now to verify the JWT on the server. Here is an example of how you would do that using node[^5], express[^6] and passport[^7]. In order to verify the JWT, we need to grab the projects
public key, go to: `Dashboard -> Your Project -> Settings -> Scroll to the bottom`.

```js
let express = require('express')
let cors = require('cors')
let fs = require('fs')
let passport = require('passport')
let JwtStrategy = require('passport-jwt').Strategy
let ExtractJwt = require('passport-jwt').ExtractJwt

// This is the public key that you can find in the admin dashboard
let publicKey = fs.readFileSync('../key.pub', { encoding: 'utf8' })

let opts = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey: publicKey,
}

passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    done(null, jwt_payload)
}))

let app = express()

app.use(cors())

app.get('/',
	passport.authenticate('jwt', { session: false }),
	(req, res) => { res.json(req.user) }
)

app.listen(8001, () => {
	console.log('Node Passport server is running')
})
```

<!-- TODO: Add next steps: Email Config -->
<!-- TODO: Link to Public/Private Route page -->
<!-- TODO: Link to In depth enpoints/jwt page -->

## Footnotes
[^1] https://docs.docker.com/compose/gettingstarted/  
[^2] https://www.postgresql.org/  
[^3] https://github.com/mailhog/MailHog  
[^4] https://reactjs.org  
[^5] https://nodejs.org  
[^6] https://expressjs.com/  
[^7] https://www.passportjs.org/  
