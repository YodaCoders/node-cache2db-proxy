const http = require('http');
const httpProxy = require('http-proxy');
const config = require('config');
const db = require('./db');
const port = config.get('port');
const proxyOptions = {...config.proxy};

//
// Create your proxy server and set the target in the options.
//
const proxy = httpProxy.createProxyServer(proxyOptions);

// Received response event
proxy.on('proxyRes', (proxyRes, req, res) => {
  let chunks = [];
  proxyRes.on('data', (chunk) => {
    chunks.push(chunk);
  });
  proxyRes.on('end', () => {
    let body = [...Buffer.concat(chunks)];
    db.cache({
      url: req.url,
      resHeaders: proxyRes.headers,
      resBody: body
    });
  });
});

//
// Create your target server
//
http.createServer(function (req, res) {
  proxy.web(req, res);
}).listen(port);

console.log(`Server started at ${port}`);
