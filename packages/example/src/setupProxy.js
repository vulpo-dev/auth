const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
	console.log({ app })
  	app.use('/__/auth', createProxyMiddleware({
		target: 'http://127.0.0.1:8000',
		changeOrigin: true,
		pathRewrite: {
			'^/__/auth': '/', // remove base path
		},
	}));
};