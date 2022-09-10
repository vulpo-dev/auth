# API Keys

## Generate an API key

The [client SDK](https://auth.vulpo.dev/docs/web/overview) provides the `generateApiKey` method that takes an optional configuration object with the following properties: `name` and `expireAt`.


## Validate Requests

In order to validate if the API key is valid, you have to make a POST request to the `/api_key/verify` endpoint with the following payload:
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

If the token is invalid, a `401` will be returned.

The test suite provides an example: https://github.com/vulpo-dev/auth/blob/master/tests/api_tests/src/api_key/verify.test.ts