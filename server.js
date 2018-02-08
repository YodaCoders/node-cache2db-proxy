const http = require('http');
const httpProxy = require('http-proxy');
const config = require('config');
const port = config.port;
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
  proxyRes.on('end', () =>
  {
    let body = Buffer.concat(chunks).buffer;
    console.log(body);

    // proxyRes.
    // write response to database
    let data = {};
    data.url = req.url;
    data.resHeaders = res.headers;
    data.resBody = body;
    data.ttl = 1000; // TODO take from config
    console.log(data); // TODO write to database
  });
});

//
// Create your target server
//
http.createServer(function (req, res) {
  proxy.web(req, res);
}).listen(port);

console.log(`Server started at ${port}`);
