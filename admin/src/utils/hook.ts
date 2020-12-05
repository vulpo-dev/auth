import { useRef, useEffect } from 'react'

export function useMounted() {
	let mounted = useRef(true)

	useEffect(() => {
		mounted.current = true
		return () => { mounted.current = false }
	},[])

	return mounted
}