import { createContext } from 'react'
import { TemplateType } from 'data/template'

type CurrentTemplate = {
	project: string;
	template: TemplateType;
}

export let TemplateCtx = createContext<CurrentTemplate>({
	project: '',
	template: TemplateType.Passwordless,
})