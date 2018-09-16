let fs = require('fs')
let path = require('path')
const ApiCache = require('./../services/apiCache').ApiCache
const $util = require('./../helper/util')
let config = require('./../config')

const getServiceWorker = () => {
  let filePath = __dirname + '/../../public/service-worker.js'
  let content = fs.readFileSync(filePath, 'utf8')
  global.serviceWorkerContent = content
  return content
}

exports.RedisCache = async function(ctx, next) {
  const request = ctx.request
  const isRequestApi = request.url.indexOf('/api/') > -1
  const isRequestSource = request.url.indexOf('/static/') > -1

  console.log('request.url', request.url)
  if (request.url === '/service-worker.js') {
    ctx.body = global.serviceWorkerContent || getServiceWorker()
    return
  }

  if (!isRequestApi && !isRequestSource) {
    if (global.indexPageContent) {
      ctx.body = global.indexPageContent
      return
    }
    let filePath = __dirname + '/../../public/index.html'
    let content = fs.readFileSync(filePath, 'utf8')
    ctx.body = content
    global.indexPageContent = content
    return
  }

  if (
    isRequestApi &&
    config.isOpenRedisFlag &&
    request.method === 'GET' &&
    !$util.isInRedisIgnoreList(ctx)
  ) {
    // 设置 cacheKey 以便在获得数据库的结果处，将数据依据此 key 存入此 Redis;
    const cacheKey = $util.getRedisCacheKey(ctx)
    ctx.request.cacheKey = cacheKey
    try {
      const respResult = await ApiCache.get(cacheKey)
      if (respResult) {
        console.log(`✔  Get Api Result From Cache Success.`)
        return $util.sendSuccess(ctx, respResult.value, false)
      }
    } catch (error) {
      console.log(`❌ Get Api Cache Error: `, error)
    }
  }
  await require('./../routes').routes()(ctx, next)
}
