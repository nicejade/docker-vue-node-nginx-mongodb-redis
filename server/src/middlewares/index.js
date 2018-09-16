let path = require('path')
let cors = require('koa2-cors')
let json = require('koa-json')
let views = require('koa-views')
let convert = require('koa-convert')
let KoaStatic = require('koa-static')
let KoaHelmet = require('koa-helmet')
let KoaMount = require('koa-mount')
let KoaSession = require('koa-session2')
let KoaRedis = require('koa-redis')
let Bodyparser = require('koa-bodyparser')

let bodyparser = Bodyparser()

let config = require('./../config')

function applyMiddleware(app) {
  app.use(
    cors({
      origin: '*',
      maxAge: 1000,
      credentials: true,
      allowMethods: ['GET', 'POST', 'DELETE'],
      allowHeaders: ['Content-Type', 'Authorization', 'Accept']
    })
  )

  app.use(convert(bodyparser))
  app.use(convert(json()))
  app.use(KoaHelmet())

  // 替换'x-koa-redis-cache' 为'x-server-cache' 同helmet信息隐藏
  app.use(async (ctx, next) => {
    await next()
    if (ctx.response.get('x-koa-redis-cache')) {
      ctx.remove('x-koa-redis-cache')
      ctx.set('x-server-cache', true)
    }
  })

  app.proxy = true
  app.use(
    KoaSession({
      store: new KoaRedis(config.main.redis.session),
      key: 'SESSIONID',
      maxAge: 86400000,
      overwrite: true,
      httpOnly: true,
      signed: true
    })
  )
  app.use(config.passport.initialize())
  app.use(config.passport.session())

  app.use(require('./cache').RedisCache)

  // handle static
  app.use(
    convert(
      KoaStatic(path.join(__dirname, '../../public'), {
        pathPrefix: ''
      })
    )
  )

  app.use(KoaMount('/api/avatar', KoaStatic(config.main.avatarUploadDir)))

  // handle views
  app.use(
    views(path.join(__dirname, '../../views'), {
      extension: 'ejs'
    })
  )

  // handle 404
  app.use(async ctx => {
    ctx.status = 404
    await ctx.render('404')
  })

  // hanle logger
  app.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
  })
}

exports.applyMiddleware = applyMiddleware
