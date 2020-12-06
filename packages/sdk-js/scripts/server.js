// include dependencies
let express = require('express');
let { createProxyMiddleware } = require('http-proxy-middleware');
let fs = require('fs')

// proxy middleware options
let options = {
  target: 'http://127.0.0.1:8000',
  pathRewrite: {'^/__/auth' : ''}
};

// create the proxy (without context)
let exampleProxy = createProxyMiddleware(options);

// mount `exampleProxy` in web server
let app = express();
app.use('/__/auth', exampleProxy);

app.get('/', async (req, res) => {
	fs.readFile('./example/index.html', 'utf8', (err, data) => {
	  if (err) throw err;
	  res.type('html').send(data)
	})
})

app.get('/client.js', async (req, res) => {
	fs.readFile('./lib/main.js', 'utf8', (err, data) => {
	  if (err) throw err;
	  res.type('js').send(data)
	})
})

app.listen(3000);