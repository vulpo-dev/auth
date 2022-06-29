---
description: Get and Verify JWTs
---

# Protect Your API Endpoints

We have showed you in the [Quickstart Guide](../01-quickstart.md#making-api-calls) how to make API calls and verify the JWT. The guide was focused on node.js, so here is a more general approach.

## Background
When a user authenticates with the authentication server, a pair of refresh and access token will be generated. The access token is used to communicate with your application, by default the access token will expire after 15 minutes and thus needs to be periodically refreshed. Once the access token is expired we will use the refresh token to communicate with the authentication server and receive a new access token, the refresh token will expire after 30 days unless the user interacts with the app.

**Note:** You only have to verify the access token in your API endpoints, the rest is will be handled for you.


## Verify The Access Token
An access token is a short lived token that is used to verify that a session is valid. The authentication server will issue access tokens as [JSON Web Tokens](https://jwt.io/introduction) or JWT for short.

1. Find a JWT in your language of choice
	- Ruby: https://github.com/jwt/ruby-jwt
	- Python: https://pyjwt.readthedocs.io/en/stable/

2. On request, grab the access token from the request header
	- Generally the access token will be in the `Authorization` header with the following format `Authorization: Bearer <access-token>`

3. Verify the token using the projects public key
	- You find the public key under: `Dashboard -> Your Project -> Settings -> Scroll to the bottom`
	- When the access token is invalid you have to return a status code of `401`. The client will then try to refresh the access token and retries the request.