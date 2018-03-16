const http = require('http');
const httpProxy = require('http-proxy');
const config = require('config');
const db = require('./db');
const port = config.get('port');
const proxyOptions = {...config.proxy};
const authToken = config.get('authToken');

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
    // Skip response if statusCode isn't equal 200
    if (proxyRes.statusCode !== 200)
      return;

    let body = [...Buffer.concat(chunks)];
    db.writeCache({
      url: req.url,
      method: req.method,
      statusCode: proxyRes.statusCode,
      resHeaders: proxyRes.headers,
      resBody: body
    });
  });
});

//
// Create your target server
//
http.createServer(async (req, res) => {
  // Authorization
  if (authToken && req.headers['authorization'] !== authToken) {
      res.statusCode = 401;
      res.end();
      return
  }

  // Read cache
  const cache = await db.readCache(req.method, req.url);
  if (!cache)
    proxy.web(req, res);
  // TODO handle the case when server returns error. Need to return cache in any case, even if it's expired
  else {
    res.statusCode = cache.statusCode;

    const contentType = cache.resHeaders['content-type'];
    if (contentType) res.setHeader('content-type', contentType);

    const contentEncoding = cache.resHeaders['content-encoding'];
    if (contentEncoding) res.setHeader('content-encoding', contentEncoding);
    res.end(Buffer.from(cache.resBody));
  }
  // proxy.web(req, res);
}).listen(port);

console.log(`Server started at ${port}`);
