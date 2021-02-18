const proxy = require('http-proxy-middleware');

module.exports = function(app) {
  var wsProxy = proxy('/socket', {
    target: 'http://localhost:1234',
    changeOrigin: true, // for vhosted sites, changes host header to match to target's host
    ws: true, // enable websocket proxy
    logLevel: 'debug'
  })
  app.use(wsProxy);
};

