let createConfig = require('../../webpack.config')

module.exports = function (_, argv) {
	let config = createConfig(argv.mode || 'production')
    return config
}