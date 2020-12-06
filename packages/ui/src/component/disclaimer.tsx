import { useConfig } from 'context/config' 
import { useTranslation } from 'context/translation' 

export let Disclaimer = () => {
	let config = useConfig()
	let t = useTranslation()
	return <t.Disclaimer tos={config.tos} privacy={config.privacy}  />
}