## Links
- [Website](https://auth.vulpo.dev)
- [GitHub](https://github.com/vulpo-dev/auth/tree/master/packages/web/sdk)
- [npm](https://www.npmjs.com/package/@vulpo-dev/auth-sdk)


## About
The core TypeScript SDK is a framework agnostic library to interact
with the vulpo authentication server.


## Get Started
In order to initialize the SDK we require the project ID as well
as the url of the server. You can find the project ID inside the
admin dashboard under `Settings -> Project -> Project ID`.

```js
import { Auth } from '@vulpo-dev/auth-sdk'

let auth = Auth.create({
	project: '<project-uuid>',
	baseURL: 'https://auth.your.app'
})
```

`Auth.create` returns an {@link AuthClient}
