let path = require('path')
let rimraf = require('rimraf')

let files = [
	'client.js',
	'client.js.LICENSE.txt',
	'lib/'
]

files.forEach(name => {
	let file = path.resolve(process.cwd(), name)
	console.log('DELETE: ', file)
	rimraf(file, (err) => {
		if (err) {
			console.log(err)
		}
	})
})