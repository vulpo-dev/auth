import { useCallback, useEffect } from 'react'
import { User } from 'data/user/types'
import { bosonFamily, useBoson } from '@biotic-ui/boson'
import { ApiError, getErrorCode } from 'error'
import { useHttp, CancelToken } from 'data/http'
import Axios from 'axios'

type UserState
	= User
	| undefined
	| null 

type RequestState = {
	value: UserState;
	initalData: UserState;
	loading: boolean;
	error: ApiError | null;
}

let userFamily = bosonFamily<[string], RequestState>(() => {
	return {
		key: 'user',
		defaultValue: {
			value: undefined,
			initalData: undefined,
			loading: true,
			error: null
		}
	}
})

type UseUser = [
	RequestState,
	(update: Partial<User>) => void
]

export function useUser(userId: string | null, projectId: string): UseUser {
	let http = useHttp()

	let [state, setState] = useBoson(userFamily(userId ?? ''))

	let fn = useCallback(() => {

		if (userId === null) {
			return
		}

		setState(state => {
			return {
				...state,
				loading: true,
				error: null,
			}
		})

		let source = CancelToken.source()

		http.get<User | null>(`/user/get?user=${userId}&project=${projectId}`)
			.then(res => {
				setState(state => {
					return {
						value: res.data,
						initalData: res.data,
						loading: false,
						error: null,
					}
				})
			})
			.catch(err => {
				if (Axios.isCancel(err)) {
					return
				}

				setState(state => {
					return {
						...state,
						loading: false,
						error: getErrorCode(err)
					}
				})
			})

		return () => {
			source.cancel()
		}

	}, [userId, http, setState, projectId])

	useEffect(() => fn(), [fn])

	let set = useCallback((update: Partial<User>) => {
		setState(state => {

			if (!state.value) {
				return state
			}

			return {
				...state,
				value: {
					...state.value,
					...update,
				}
			}
		})
	}, [setState])

	return [state, set]
}