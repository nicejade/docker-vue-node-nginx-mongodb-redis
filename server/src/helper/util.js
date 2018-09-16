/*
  DESC：对Date的扩展，将 Date 转化为指定格式的String。
      月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
      年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) 例子：
      (new Date()).Format("YYYY-MM-DD hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
      (new Date()).Format("YYYY-M-D h:m:s.S")      ==> 2006-7-2 8:9:4.18
*/
const axios = require('axios')
const cheerio = require('cheerio')
const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const mongoSanitize = require('mongo-sanitize')
const formidable = require('formidable')
const Url = require('url')

const errorMsgConfig = require('./errorMsgConf.js')
const successMsgConfig = require('./successMsgConf.js')
const { UserModel } = require('./../models/index')
const config = require('./../config')

// 原有的 mongoSanitize 不递归过滤；
function mongoSanitizeRecurse(obj) {
  mongoSanitize(obj)
  _.each(obj, v => {
    if (_.isObject(v)) {
      mongoSanitizeRecurse(v)
    }
  })
}

Date.prototype.Format = function(fmt) {
  var o = {
    'M+': this.getMonth() + 1,
    'D+': this.getDate(),
    'h+': this.getHours(),
    'm+': this.getMinutes(),
    's+': this.getSeconds(),
    'q+': Math.floor((this.getMonth() + 3) / 3),
    S: this.getMilliseconds()
  }
  if (/(Y+)/.test(fmt))
    fmt = fmt.replace(
      RegExp.$1,
      (this.getFullYear() + '').substr(4 - RegExp.$1.length)
    )
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
      )
    }
  }
  return fmt
}

module.exports = {
  // 安全过滤ctx.query/ctx.request.body等
  sanitize(obj) {
    mongoSanitizeRecurse(obj)
  },

  sendSuccess(ctx, result, isUpdateRedis = true) {
    ctx.statstatusus = 200
    ctx.body = {
      success: true,
      value: result
    }
    /*
		@desc: 使用 Redis 将 GET 请求做缓存, 以提升效率 & 减少数据库压力;
		@date: 2018-03-24
		*/
    const cacheKey = ctx.request.cacheKey
    if (
      config.isOpenRedisFlag &&
      isUpdateRedis &&
      cacheKey &&
      !this.isInRedisIgnoreList(ctx)
    ) {
      const ApiCache = require('./../services/apiCache').ApiCache
      ApiCache.set(ctx.request.cacheKey, ctx.body)
    }
  },

  sendSuccessWithMsg(ctx, signStr, extraParam) {
    let msgVal = successMsgConfig[signStr]['zh']
    msgVal = extraParam ? msgVal.replace('@#', extraParam) : msgVal
    ctx.status = 200
    ctx.body = {
      success: true,
      value: msgVal
    }
  },

  sendFailure(ctx, signStr, errMsg) {
    ctx.body = {
      success: false,
      message: signStr ? errorMsgConfig[signStr]['zh'] : errMsg
    }
  },

  // findUser：params === {} 即获得所有用户信息；
  findUser(params = {}) {
    return new Promise((resolve, reject) => {
      UserModel.findOne(params, (err, doc) => {
        if (err) {
          reject(err)
        }
        resolve(doc)
      })
    })
  },

  findUserIdByUsername(username) {
    return new Promise((resolve, reject) => {
      UserModel.findOne({ username: username }, (err, foundUser) => {
        if (err) {
          reject(err)
        }
        resolve(foundUser._id)
      })
    })
  },

  // Role authorization check
  checkRoleByUserId(userId, role) {
    return new Promise((resolve, reject) => {
      try {
        UserModel.findOne({ _id: userId }, (err, foundUser) => {
          if (err) {
            return reject(err)
          }
          if (foundUser.role === role) {
            return resolve(true)
          } else {
            return resolve(false)
          }
        })
      } catch (error) {
        return $util.sendFailure(ctx, null, 'Opps, Something Error :' + error)
      }
    })
  },

  query(search) {
    let str = search || window.location.search
    let objURL = {}

    str.replace(new RegExp('([^?=&]+)(=([^&]*))?', 'g'), ($0, $1, $2, $3) => {
      objURL[$1] = $3
    })
    return objURL
  },

  formatDate(date, rule = 'YYYY-MM-DD') {
    return (date && date.Format(rule)) || ''
  },

  verifyIsLegalEmail(str) {
    const pattern = new RegExp(
      '^([a-z0-9_\\.-]+)@([\\da-z\\.-]+)\\.([a-z\\.]{2,6})$',
      'g'
    )
    return pattern.test(str)
  },

  verifyUserIdEffective(userId) {
    let regExp = new RegExp('^[A-Za-z0-9]{24}$|^[A-Za-z0-9]{32}$')
    return regExp.test(userId)
  },

  queryString(url, query) {
    let str = []
    for (let key in query) {
      str.push(key + '=' + query[key])
    }
    return url + '?' + str.join('&')
  },

  // 获取当前地址，指定参数的值;
  getUrlParam(url, name) {
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)')
    var r = url.search.substr(1).match(reg)
    if (r != null) {
      return unescape(r[2])
    }
    return null
  },

  easyCompressString(str = '', factor = 9) {
    str = str.toString()
    let result = 0
    for (var i = 0; i < str.length; i++) {
      result += str.charCodeAt(i) * factor
    }
    return result
  },

  getRedisCacheKey(ctx) {
    const request = ctx.request
    const originUrlParsed = Url.parse(request.originalUrl)

    const cachePath = originUrlParsed ? originUrlParsed.pathname : ''
    const cacheParam = this.easyCompressString(originUrlParsed.path, 88)
    const cacheKey = `${cachePath}-${cacheParam}`
    console.log(`Current cacheKey is : ${cacheKey}`)
    return cacheKey
  },

  isInRedisIgnoreList(ctx) {
    const ignoreApiList = [
      'crawlLinksInfo',
      'getNiceLinks',
      'getUserInfo',
      'getProfile'
    ]
    const currentUrl = ctx.request.url
    let isInIgnoreListFlag = false
    ignoreApiList.forEach(element => {
      if (currentUrl.indexOf(element) > -1) {
        isInIgnoreListFlag = true
      }
    })
    return isInIgnoreListFlag
  },

  getQueryObject(queryStr) {
    var str = queryStr === undefined ? location.search : queryStr
    var obj = {}
    var reg = /([^?&=]+)=([^?&=]*)/g
    str.replace(reg, function(match, $1, $2) {
      var name = decodeURIComponent($1)
      var val = decodeURIComponent($2)
      obj[name] = val
    })
    return obj
  },

  getWebPageInfo(url) {
    return new Promise((resolve, reject) => {
      return axios
        .get(url)
        .then(res => {
          try {
            let $ = cheerio.load(res.data)
            let description = $('meta[name="description"]').attr('content')
            let keywords = $('meta[name="keywords"]').attr('content')
            let result = {
              title: $('title').text() || $('meta[og:title"]').attr('content'),
              keywords:
                keywords ||
                $('meta[property="og:keywords"]').attr('content') ||
                '',
              desc:
                description ||
                $('meta[property="og:description"]').attr('content')
            }
            resolve(result)
          } catch (err) {
            console.log('Opps, Download Error Occurred !' + err)
            resolve({})
          }
        })
        .catch(err => {
          console.log('Opps, Axios Error Occurred !' + err)
          resolve({})
        })
    })
  },

  generateRandomStr(length = 16) {
    let randomStr = ''
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const possibleLen = possible.length
    for (let i = 0; i < length; i++) {
      randomStr += possible.charAt(Math.floor(Math.random() * possibleLen))
    }
    return randomStr
  },

  async saveAvatarAndGetPath(req, imgName) {
    return new Promise((resolve, reject) => {
      const form = formidable.IncomingForm()
      form.uploadDir = config.main.avatarUploadDir
      try {
        form.parse(req, async (err, fields, files) => {
          console.log(err, fields, files)
          const fullName = imgName + path.extname(files.file.name)
          const repath = config.main.avatarUploadDir + fullName
          await fs.rename(files.file.path, repath)
          return resolve(fullName)
        })
      } catch (err) {
        fs.unlink(files.file.path)
        return reject('保存图片失败')
      }
    })
  }
}
