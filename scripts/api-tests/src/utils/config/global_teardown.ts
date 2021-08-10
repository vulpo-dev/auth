import Pool from '../db'

export default async () => {
	await Pool.end()
	console.log('DB Pool Closed')
}