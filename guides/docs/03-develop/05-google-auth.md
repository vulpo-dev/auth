# Sign In With Google

To obtain your Google OAuth credentials, you will need to follow the steps below:

1. Go to the [Google API Console](https://console.cloud.google.com/apis/credentials).

2. Sign in to your Google account if you are not already signed in.

3. Click on the `+ Create Credentials` button, and then select `OAuth client ID` from the dropdown menu.

4. Select `Web application` as the application type.

5. Enter a name for your OAuth client in the `Name` field.

6. In the `Authorized redirect URIs` field, enter the URI where you want Google to redirect users after they grant or deny permission. This is typically the URI of your app's authorization server, which will handle the response from Google. **Note:** The default redirect URI is: `https://your-domain.com/auth/oauth/confirm`.

7. Click the `Create` button to create your OAuth client.

8. Once your OAuth client has been created, you will see a modal window with your client ID and client secret. Copy these values, as you will need them in your application to authenticate with Google.

9. Click `OK` to close the modal window.

10. Click on the `Edit` button next to your OAuth client to view or update your client's settings, such as the authorized redirect URIs or the client name.

11. Click `Save` to save any changes you have made to your OAuth client.

That's it! You now have your Google OAuth credentials, which you can use in your application to allow users to sign in with their Google accounts.

