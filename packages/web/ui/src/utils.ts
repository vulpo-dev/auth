import { ErrorMessage } from 'context/translation'

type Messages = Pick<ErrorMessage,
	'password_min_length' |
	'password_max_length'
>

export function checkPasswordLength(elm: HTMLInputElement, t: Messages) {
	let len = elm.value.length
	if (len < 8) {
		elm.setCustomValidity(t.password_min_length)
	} else if (len > 64) {
		elm.setCustomValidity(t.password_max_length)
	} else {
		elm.setCustomValidity('')
	}
}
