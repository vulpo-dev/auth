import { ErrorMessage } from 'context/translation'

export function checkPasswordLength(elm: HTMLInputElement, t: ErrorMessage) {
	let len = elm.value.length
	if (len < 8) {
		elm.setCustomValidity(t.password_min_length)
	} else if (len > 64) {
		elm.setCustomValidity(t.password_max_length)
	} else {
		elm.setCustomValidity('')
	}
}