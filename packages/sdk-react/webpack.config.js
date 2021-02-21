let createConfig = require('../../webpack.config')

module.exports = function (_, argv) {
	return createConfig(argv.mode || 'production')
}