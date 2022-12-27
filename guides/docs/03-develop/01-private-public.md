# Private and Public Routes

The `<PrivateRoute />` and ``<PublicRoute />`` components allow you to control the visibility of routes within your application.

## `<PublicRoute />`

As the name suggests, `<PublicRoute />` elements are accessible to non-authenticated users and are open to the public. Note: [`useAuth`](https://auth.vulpo.dev/docs/web/functions/ui_src_main.useUser) will return undefined while the SDK is still trying to load a user and null if there is no user.


## `<PrivateRoute />`

`<PrivateRoute />` elements are only accessible to authenticated users. If a user navigates to a `<PrivateRoute />` without being authenticated, the following will happen:

1. The user will be redirected to the auth routes, with the default route being /auth.
2. The user can either create a new account or sign in to an existing account.
3. After successful authentication, the user will be redirected to the initial route they were trying to access.


## Internals

Both `<PublicRoute />` and `<PrivateRoute />` are small wrappers around the `<Route />`[^1] element from react-router-dom[^2]. In fact, `<PublicRoute />` and `<PrivateRoute />` do not do anything on their own. Instead, the `<AuthShell />` component handles all of the heavy lifting, including managing the user's auth state, redirects, and access control.

- Source: [`<PublicRoute />` and `<PrivateRoute />`](https://github.com/vulpo-dev/auth/blob/master/packages/web/ui/src/utils.ts#L58)  
- Source: [`<AuthShell />`](https://github.com/vulpo-dev/auth/blob/master/packages/web/ui/src/auth_shell.tsx#L122)


## Footnotes

[^1] https://reactrouter.com/docs/en/v6/components/route
[^2] https://reactrouter.com/docs/en/v6/getting-started/overview