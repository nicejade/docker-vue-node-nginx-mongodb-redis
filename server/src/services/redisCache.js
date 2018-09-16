const Redis = require('redis')
const Bluebird = require('bluebird')

/*
  @desc: Fix Bug: TypeError: this.redisClient.getAsync is not a function
  @link: https://github.com/NodeRedis/node_redis#bluebird-promises
  @date: 2018-03-24
*/
Bluebird.promisifyAll(Redis.RedisClient.prototype)

const redisBaseConfig = {
  retry_strategy(options) {
    console.log(options.error)
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.log(`❗️ Error: ${options.error.message}`)
      return undefined
    }

    if (options.times_connected > 10) {
      return undefined
    }

    return Math.min(options.attempt * 100, 500)
  }
}

class RedisCache {
  constructor(settings) {
    this.settings = settings
    this.options = settings.options
    this.redisClient = null
    this.setup()
  }

  setup() {
    this.redisConfig = Object.assign({}, redisBaseConfig, this.options)
    this.redisClient = Redis.createClient(this.redisConfig)

    this.redisClient.on('error', function(error) {
      console.error(`❗️ Redis Error: ${error}`)
    })

    this.redisClient.on('ready', () => {
      console.log('✅ 💃 redis have ready !')
    })

    this.redisClient.on('connect', () => {
      console.log('✅ 💃 connect redis success !')
    })
  }

  async set(key, val) {
    if (!key || !val) {
      const whichOne = !key && !val ? 'Key and val' : !key ? 'key' : 'val'
      throw new Error(`❌  ${whichOne} required when set new cache item.`)
    }

    if (typeof key !== 'string') {
      throw new Error('❌ Expected key is a string.')
    }

    try {
      const result = this.redisClient.setAsync(key, val)
      this.redisClient.expire(key, 180)
      if (result.toString() === 'OK') {
        return val
      }
    } catch (error) {
      throw new Error(`❌ Set cache failed, key is ${key}`)
    }
  }

  /**
   * @desc 为某条 Key 设置对应的过期时长;
   * @param {*} time 单位(S) 默认三分钟.
   */
  async setExpire(key, length = 180) {
    this.redisClient.expire(key, length)
  }

  async get(key) {
    if (!key) {
      throw new Error('❌ Key is required when fetch value.')
    }

    return await this.redisClient.getAsync(key)
  }
}

exports.RedisCache = RedisCache
