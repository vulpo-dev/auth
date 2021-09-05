import { CancelToken, useHttp } from 'data/http'
import { bosonFamily, useQuery } from '@biotic-ui/boson'
import { LanguageCode } from 'data/languages'
import { useCallback } from 'react';

type CancelFn = (fn: () => void) => void;

type Translation = { [key: string]: string }
type Translations = { [code: string]: string; }
type TranslationsResponse = { [code: string]: Translation; }

let translationFamily = bosonFamily<[string, string], Translations | undefined>((project, template) => {
	return {
		defaultValue: undefined,
	}
})

export function useTranslations(
	project: string,
	template: string,
) {
	let http = useHttp()
	return useQuery(translationFamily(project, template), async () => {
		let options = {
			params: { project, template }
		}

		let res = await http.get<TranslationsResponse>('/template/translations', options)

		return Object.fromEntries(
			Object.entries(res.data).map(([code, translations]) => {
				return [code, JSON.stringify(translations, null, 2)]
			})
		)
	})
}

export function useSetTranslation(
	project: string,
	template: string,
) {
	let http = useHttp()
	return useCallback(async (language: string, content: Translation) => {
		return await http.post('/template/translations/set', {
			project,
			template,
			language,
			content,
		})
	}, [project, template])
}