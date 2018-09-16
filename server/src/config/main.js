let { join } = require('path')
const isDevelopmentEnv =
  process.env.NODE_ENV && process.env.NODE_ENV === 'development'
const dbhost = isDevelopmentEnv ? 'localhost' : 'mongodb'
const redishost = isDevelopmentEnv ? '127.0.0.1' : 'redis'

let config = {
  env: isDevelopmentEnv ? 'development' : 'production',

  // Secret key for JWT signing and encryption
  secret: 'super-secret-passphrase',

  // Database connection information
  database: `mongodb://${dbhost}:27017/awesome-webapp`,

  // Setting port for server
  port: process.env.PORT || 4000,

  redis: {
    session: {
      host: `${redishost}`,
      port: 6379,
      db: 0
    },
    client: {
      host: `${redishost}`,
      port: 6379,
      db: 1
    }
  },

  // Avatar upload path
  avatarUploadDir: join(__dirname, './../../upload/avatar/')
}

module.exports = config
