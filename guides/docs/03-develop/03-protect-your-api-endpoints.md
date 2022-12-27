# Protect Your API Endpoints

This guide shows you how to verify JSON Web Tokens (JWTs) in order to protect your API endpoints. This is a more general approach than the one shown in the [Quickstart Guide](../01-quickstart.md#making-api-calls), which focused on node.js.


## Background

When a user authenticates with the authentication server, a pair of refresh and access tokens is generated. The access token is used to communicate with your application. By default, the access token expires after 15 minutes and must be periodically refreshed. Once the access token expires, we can use the refresh token to communicate with the authentication server and receive a new access token. The refresh token expires after 30 days, unless the user interacts with the app.

**Note**: You only need to verify the access token at your API endpoints. The rest is handled for you.


## Verify the Access Token

An access token is a short-lived token that is used to verify that a session is valid. The authentication server will issue access tokens as JWTs.

1. Find a JWT library for your language of choice. Here are a few options:

    - Ruby: https://github.com/jwt/ruby-jwt
    Python: https://pyjwt.readthedocs.io/en/stable/

2. On each request, grab the access token from the request header. It is usually in the `Authorization` header in the following format: `Authorization: Bearer <access-token>`.

3. Verify the token using the project's public key. You can find the public key under: `Dashboard -> Your Project -> Settings -> Scroll to the bottom`. If the access token is invalid, return a status code of `401`. The client will then try to refresh the access token and retry the request.