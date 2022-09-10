---
description: Zero config authentication
---

# Authentication Shell

The `<AuthShell />` is a a top level component that handles the entire authentication life-cycle for you and requires minimal configuration on your end.

## Set up

Make sure you have an instance of the authentication server running and you have installed the required packages. Head over to our [Quickstart Guide](../01-quickstart.md) in order to get your environment up and running.

### Install packages
`npm install @vulpo-dev/auth-ui react-router-dom`

### Configure the shell

1. Initialize the [`AuthClient`](https://auth.vulpo.dev/docs/web/classes/sdk_src_main.AuthClient)
```tsx
import { Auth } from '@vulpo-dev/auth-sdk'

let AuthClient = Auth.create({
  // Got to localhost:8000 -> Your Project -> Settings
  project: '<project-id>',
  baseURL: 'http://localhost:8000'
})
```

2. Wrap your component inside of `<AuthCtx.Provider />` and `<BrowserRouter />`[^1], you can also use any other router that react-router-dom provides.
```tsx
import { BrowserRouter } from 'react-router-dom'
import { Auth as AuthCtx } from '@vulpo-dev/auth-react'

/* AuthClient set up */

{/* The AuthShell needs to be inside of BrowserRouter */}
<BrowserRouter>
  {/* Wrap your application inside the Auth Context */}
  <AuthCtx.Provider value={AuthClient}>
    <App />
  </AuthCtx.Provider>
</BrowserRouter>
```

3. Set up the `<AuthShell />`
```tsx
import React from 'react'
import { Route, Link } from 'react-router-dom'
import { AuthShell, PrivateRoute, PublicRoute } from '@vulpo-dev/auth-ui'

let App = () => {
    return (
        <AuthShell>
           {/* Routes are by default private */}
           <Route />

           {/* You can also be more explicit */}
           <PrivateRoute />

           {/* A PublicRoute will be accessible by everyone */}
           <PublicRoute />
        </AuthShell>
    )
}
export default App

```


## Configure

### Dark mode

By default, the auth shell uses a light theme to render the auth screens. You can use the `dark` prop to change the default behavior like so:
```tsx
<AuthShell dark />
```

You can also use something like [`useMediaQuery`](https://usehooks-ts.com/react-hook/use-media-query) to adjust the theme based on the users preference:
```tsx
import { useMediaQuery } from 'usehooks-ts'

export default function Component() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')

  return (
    <AuthShell dark={prefersDark} />
  )
}

```

### Splash screen
The splash screen is what the user sees the first time they enter your application, the android documentation provides a great overview: https://developer.android.com/guide/topics/ui/splash-screen. The `<AuthShell />` provides a basic splash screen for you that you can customize either through CSS or by providing your own component.

#### CSS

1. Let's start by passing the `name` that should be rendered on the splash screen.
```tsx
<AuthShell name="Application name" />
```

2. Overwrite the default styles, there are two `CSS` classes that you can target: `vulpo-auth-splashscreen` and `vulpo-auth-splashscreen-title`
```css
/* The splash screen wrapper */
.vulpo-auth-splashscreen {

}

/* The name we passed to the auth shell */
.vulpo-auth-splashscreen-title {

}

.vulpo-auth-splashscreen .vulpo-auth-flow {
	--size: 40px; /* Change the size of the loading dots */
	--color: currentColor; /* Change the color of the loading dots */

	/* You can also add your own rules */	
}

/* Use vulpo-auth-flow-dot to target dots directly  */	
.vulpo-auth-splashscreen .vulpo-auth-flow-dot {

}
```

#### Bring your own component

If you require more customization, you can also pass a custom component to `<AuthShell />` that will be rendered instead of the [default implementation](https://github.com/vulpo-dev/auth/blob/master/packages/web/ui/src/component/splashscreen.tsx).

1. Create your custom splash screen, here is the default implementation as reference:
```tsx
import React, { FunctionComponent } from 'react'
import { Flow } from './loading'

type Props = {
	name?: string;
	background?: string;
}

let Splashscreen: FunctionComponent<Props> = (props) => {

	let style = {
		background: props.background ?? '#fff'
	}

	return (
		<div style={style} className="vulpo-auth vulpo-auth-splashscreen">
			{ props.name && <h1 className="vulpo-auth-splashscreen-title">{ props.name }</h1> }
			<Flow />
		</div>
	)
}

export default Splashscreen
```

2. Pass your `<Splashscreen />` to the `<AuthShell />`
```tsx
<AuthShell splashscreen={<Splashscreen />} />
```


### Auth screen
You can pass a custom authentication screen to the `<AuthSchell />` that will be rendered instead. The `auth screen` is the component that will be rendered when a user is not authenticated.

1. Create your `auth screen`
```tsx
// Auth contains all of the authentication screens,
// it also handles routing, flags and error handling
import React, { FunctionComponent } from 'react'
import { Auth } from '@vulpo-dev/auth-ui'

let Authscreen: FunctionComponent = () => {
	return (
		<div className="authscreen">
			<header className="authscreen-header">
				<h2>VULPO Auth</h2>
			</header>
			<div className='vulpo-auth vulpo-auth-container'>
				<div className="vulpo-auth-box-shadow">
					<Auth />
				</div>
			</div>
		</div>
	)
}

export default Authscreen
```

2. Pass your `<Authscreen />` to the `<AuthShell />`
```tsx
<AuthShell authscreen={<Authscreen />} />
```

## Links
- [`@vulpo-dev/auth-ui`](https://www.npmjs.com/package/@vulpo-dev/auth-ui)
- [`@vulpo-dev/auth-react`](https://www.npmjs.com/package/@vulpo-dev/auth-react)
- [`@vulpo-dev/auth-sdk`](https://www.npmjs.com/package/@vulpo-dev/auth-skd)


## Footnotes
[^1] https://reactrouter.com/docs/en/v6/routers/browser-router
