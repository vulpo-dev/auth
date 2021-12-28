import { ErrorMessage } from 'context/translation'

export const BASELINE = 'var(--vulpo-auth-baseline, 8px)'
export const ERROR = 'var(--vulpo-auth-error, #ff5555)'
export const CARD_BACKGROUND = 'var(--vulpo-auth-card-background, #fff)'
export const SHADOW = '0 13px 34px rgba(0,0,0,0.25), 0 8px 8px rgba(0,0,0,0.21)'
export const BORDER_COLOR = 'var(--vulpo-auth-border-color, #e9e9e9)'

export type WithClass = {
	className?: string;
}

export let withClass = (baseClass: string) => ({ className = '' }: WithClass) => {
	return {
		className: `${baseClass} ${className}`
	}
}

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
