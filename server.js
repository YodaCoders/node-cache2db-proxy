const http = require('http')
const httpProxy = require('http-proxy')
const fetch = require('node-fetch')
const config = require('config')
const db = require('./db')
const port = config.get('port')
const proxyOptions = {...config.proxy}
const authToken = config.get('authToken')
const checkTtl = config.get('checkTtl')

//
// Create your proxy server and set the target in the options.
//
// TODO remove proxy and use fetch for everything
const proxy = httpProxy.createProxyServer(proxyOptions)

// Received response event
proxy.on('proxyRes', (proxyRes, req, res) => {
  let chunks = []

  proxyRes.on('data', (chunk) => {
    chunks.push(chunk)
  })

  proxyRes.on('end', () => {
    // Skip response if statusCode isn't equal 200
    if (proxyRes.statusCode !== 200)
      return

    // TODO check the option to convert body to BSON before saving to DB
    let body = [...Buffer.concat(chunks)]
    db.writeCache({
      url: req.url,
      method: req.method,
      statusCode: proxyRes.statusCode,
      resHeaders: proxyRes.headers,
      resBody: body
    })
  })
})

//
// Create your target server
//
http.createServer(async (req, res) => {
  // Authorization
  if (authToken && req.headers['authorization'] !== authToken) {
    res.statusCode = 403
    res.end()
    return
  }

  // Read cache
  let cache = await db.readCache(req.method, req.url)

  if (!cache)
    proxy.web(req, res)
  else {
    // Check TTL
    if (checkTtl) {
      const cacheDate = new Date(cache.date)
      const isExpired = Date.now() - cacheDate.getTime() > cache.ttl
      if (isExpired) {
        try {
          // Call target url
          const proxyRes = await fetch(`${proxyOptions.target}${req.url}`, {
            method: req.method,
            headers: {...req.headers, host: 'acat.online', authorization: proxyOptions.headers.Authorization},
            // TODO implement body support
            body: null
          })

          // If the call is successful then replace cache
          if (proxyRes.status === 200) {
            const body = await proxyRes.buffer()
            const resHeaders = {}
            proxyRes.headers.forEach((value, key, map) => {
              resHeaders[key] = value
            })
            cache = {
              url: req.url,
              method: req.method,
              statusCode: proxyRes.status,
              resHeaders,
              resBody: [...body]
            }
            db.writeCache(cache)
          }
        } catch (err) {
          // don't care about error at the moment
        }
      }
    }

    res.statusCode = cache.statusCode
    const contentType = cache.resHeaders['content-type']
    if (contentType) res.setHeader('content-type', contentType)
    const contentEncoding = cache.resHeaders['content-encoding']
    if (contentEncoding) res.setHeader('content-encoding', contentEncoding)
    res.end(Buffer.from(cache.resBody))
  }
  // proxy.web(req, res);
}).listen(port)

console.log(`Server started at ${port}`)
