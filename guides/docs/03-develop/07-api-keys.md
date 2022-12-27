# API Keys


## Generate an API Key

The [client SDK](https://auth.vulpo.dev/docs/web/overview) provides the `generateApiKey` method, which takes an optional configuration object with the following properties:

- `name`: A name for the API key.
- `expireAt`: A timestamp for when the API key should expire.


## Validate Requests

To validate an API key, make a POST request to the `/api_key/verify` endpoint with the following payload:

```json
{
  "api_key": "<api-key>"
}
```

If the API key is valid, a claims object will be returned:
```ts
type Claims = {
  sub: string; // the user id
  exp: number, // timestamp until the claims expire
  traits: Array<string>, // traits given to the user
}
```

If the token is invalid, a `401` status will be returned.

You can find an example in the test suite: https://github.com/vulpo-dev/auth/blob/master/tests/api_tests/src/api_key/verify.test.ts