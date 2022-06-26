---
description: Manage visibility of routes
---

# Private And Public Routes

`<PrivateRoute />` and `<PublicRoute />` allow you to define the
visibility of routes inside your application. 


## `<PublicRoute />`

As the name suggests, `<PublicRoute />` elements are accessible by
non authenticated users and are open to the public.  
**Note**: [`useAuth`](https://auth.vulpo.dev/docs/web/functions/ui_src_main.useUser) will return `undefined` while the SDK
is still trying to load a user and `null` if there is no user.


## `<PrivateRoute />`

`<PrivateRoute />`'s are only accessible to authenticated users.
Here is what happens when a user navigates to a `<PrivateRoute />` without being authenticated:
1. The user gets redirected to the auth routes, the default route is `/auth`.
2. The user can either create a new account or sign in to an existing account.
3. After successful authentication, the user is then redirected to the initial route they where trying to access.


## Internals

Both `<PublicRoute />` and `<PrivateRoute />` are just small wrappers around the `<Route />`[^1] element from react-router-dom[^2],
in fact, `<PublicRoute />` and `<PrivateRoute />` on it's own do
nothing, our `<AuthShell />` is doing all the heavy lifting for us, managing the user auth state, redirects, access control etc.

- Source: [`<PublicRoute />` and `<PrivateRoute />`](https://github.com/vulpo-dev/auth/blob/master/packages/web/ui/src/utils.ts#L58)  
- Source: [`<AuthShell />`](https://github.com/vulpo-dev/auth/blob/master/packages/web/ui/src/auth_shell.tsx#L122)  


## Footnotes
[^1] https://reactrouter.com/docs/en/v6/components/route  
[^2] https://reactrouter.com/docs/en/v6/getting-started/overview
