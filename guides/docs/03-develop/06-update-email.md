# Update a users email

## Internals

The following flow happens when you update a users email address:
1. The request to change the email will be stored to in the database.
2. Two emails will be send out:
	1. The old email address will be informed of the request with an option to reset/undo the change.
	2. The new email address will receive an email in order to confirm the new address.
3. Once the new email address has been confimed, the user will be updated with the new email address.

**Note:** once the flow has been rejected, a new request has to be made. 