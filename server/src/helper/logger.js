let winston = require('winston')
let fs = require('fs-extra')
let { join, dirname } = require('path')
let $util = require('./../helper/util')

let projectName = 'awesome-webapp'
let currentDate = $util.formatDate(new Date(), 'YYYY-MM-DD')
let filename = join(__dirname, `./../../logs/${currentDate}.log`)

let env = process.env.NODE_ENV
if (env === 'production') {
  filename = `/data/logs/${projectName}/prod/${currentDate}.log`
} else if (env === 'testing') {
  filename = `/data/logs/${projectName}/beta/${currentDate}.log`
}

fs.ensureDirSync(dirname(filename))

let logger = new winston.Logger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename })
  ]
})

module.exports = logger
logger.info('logger start: ', { env, filename })
