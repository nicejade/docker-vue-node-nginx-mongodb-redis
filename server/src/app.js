let http = require('http')
let Koa = require('koa')
let koaOnError = require('koa-onerror')
let logger = require('./helper/logger')

let applyMiddleware = require('./middlewares').applyMiddleware
let config = require('./config')

const app = new Koa()
applyMiddleware(app)

// 500 error
koaOnError(app, {
  template: 'views/500.ejs'
})

// error logger
app.on('error', async (err, ctx) => {
  logger.error('app.on error:', { err: err.stack })
})

const port = parseInt(config.main.port || '3000')
const server = http.createServer(app.callback())

server.listen(port)
server.on('error', error => {
  if (error.syscall !== 'listen') {
    throw error
  }
  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(port + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(port + ' is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
})

server.on('listening', () => {
  console.log('Listening on port: %d', port)
})

module.exports = app
