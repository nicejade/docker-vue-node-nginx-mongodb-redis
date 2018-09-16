const Bluebird = require('bluebird')
const RedisCache = require('./redisCache').RedisCache
const config = require('./../config')
const redisConfig = config.main.redis

class PageCache extends RedisCache {
  constructor(settings) {
    super(settings)
  }

  async set(key, val) {
    const result = super.set(key, val)
    super.setExpire(key, 7 * 24 * 60 * 60)
    return result
  }

  async get(key) {
    const result = await super.get(key)
    if (!result) {
      return new Bluebird((resolve, reject) => {
        resolve(null)
      })
    }

    return super.get(key)
  }
}

exports.PageCache = new PageCache({
  options: {
    host: redisConfig.client.host,
    port: redisConfig.client.port || 39,
    db: redisConfig.client.db || 1,
    return_buffers: false
  }
})
