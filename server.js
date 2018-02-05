const http = require('http');
const httpProxy = require('http-proxy');
const config = require('config');
const port = config.port;
const proxyOptions = {...config.proxy};

//
// Create your proxy server and set the target in the options.
//
const proxy = httpProxy.createProxyServer(proxyOptions);

//
// Create your target server
//
http.createServer(function (req, res) {
  proxy.web(req, res);
}).listen(port);

console.log(`Server started at ${port}`);
