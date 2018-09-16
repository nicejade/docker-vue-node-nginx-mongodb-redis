let mongoose = require('mongoose')
let config = require('./../config')

/* Solve Problem: (node) DeprecationWarning:
  Mongoose: mpromise (mongoose's default promise library) is deprecated
*/
mongoose.Promise = global.Promise

function connectDatabase(uri) {
  return new Promise((resolve, reject) => {
    mongoose.connection
      .on('error', error => reject(error))
      .on('close', () => console.log('Database connection closed.'))
      .once('open', () => resolve(mongoose.connections[0]))
    mongoose.connect(uri)
  })
}

connectDatabase(config.main.database)

exports.Links = require('./linksModel')
exports.UserModel = require('./userModel')
