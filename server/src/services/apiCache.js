const Bluebird = require('bluebird')
const RedisCache = require('./redisCache').RedisCache
const config = require('./../config')
const redisConfig = config.main.redis

/*
  const zlib = Bluebird.promisifyAll(require('zlib'));
  const gzip = (val) => {
    return zlib.gzipAsync(val)
  }

  const unzip = (binary) => {
    return zlib.unzipAsync(binary)
  }
*/

const stringify = string => {
  return new Bluebird((resolve, reject) => {
    try {
      resolve(JSON.stringify(string))
    } catch (err) {
      reject(err)
    }
  })
}

const parse = string => {
  return new Bluebird((resolve, reject) => {
    try {
      resolve(JSON.parse(string))
    } catch (err) {
      reject(err)
    }
  })
}

const convert = buffer => {
  return new Bluebird((resolve, reject) => {
    try {
      resolve(buffer.toString())
    } catch (err) {
      reject(err)
    }
  })
}

class ApiCache extends RedisCache {
  constructor(settings) {
    super(settings)
  }

  async set(key, val) {
    let newVal = await stringify(val)
    return super.set(key, newVal)
  }

  async setExpire(key, length = 180) {
    super.setExpire(key, length)
  }

  async get(key) {
    const result = await super.get(key)
    if (!result) {
      return new Bluebird((resolve, reject) => {
        resolve(null)
      })
    }

    return super
      .get(key)
      .then(buffer => convert(buffer))
      .then(json => parse(json))
  }
}

exports.ApiCache = new ApiCache({
  options: {
    host: redisConfig.client.host,
    port: redisConfig.client.port || 39,
    db: redisConfig.client.db || 0,
    return_buffers: true
  }
})
