const http = require('http');
const httpProxy = require('http-proxy');
const config = require('config');
const PORT = config.port;

//
// Create your proxy server and set the target in the options.
//
const proxy = httpProxy.createProxyServer({});

//
// Create your target server
//
http.createServer(function (req, res) {
  proxy.web(req, res);
}).listen(PORT);

console.log(`Server started at ${PORT}`);
