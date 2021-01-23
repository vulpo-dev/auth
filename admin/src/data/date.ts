import { format as f } from 'date-fns'

export function format(date: Date) {
	return f(date, 'yyyy-mm-dd')
}
