const $util = require('./../helper/util'),
  axios = require('axios'),
  // secretConf = require("./../config/secret"),
  secretConf = {
    appid: '',
    secret: ''
  },
  sha1 = require('sha1')

const getAccessToken = () => {
  return new Promise((resolve, reject) => {
    const baseUrl =
      'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&'
    const appid = secretConf.appid
    const secret = secretConf.secret
    const requestUrl = baseUrl + `appid=${appid}&secret=${secret}`
    console.log('Current getAccessToken requestUrl is: ', requestUrl)
    return axios
      .get(requestUrl)
      .then(result => {
        resolve(result.data)
      })
      .catch(err => {
        console.log('🐛 Opps, Axios Error Occurred !' + err)
        resolve({})
      })
  })
}

const getWechatTicket = params => {
  return new Promise((resolve, reject) => {
    const baseUrl =
      'https://api.weixin.qq.com/cgi-bin/ticket/getticket?&type=jsapi'
    const requestUrl = baseUrl + `&access_token=${params.access_token}`
    console.log('Current requestUrl is: ', requestUrl)
    return axios
      .get(requestUrl)
      .then(res => {
        resolve(res.data)
      })
      .catch(err => {
        console.log('🐛 Opps, Axios Error Occurred !' + err)
        resolve({})
      })
  })
}

exports.getWechatApiSignature = async (ctx, next) => {
  const url = ctx.request.query.url
  const requestParam = await getAccessToken()
  const result = await getWechatTicket(requestParam)
  const noncestr = $util.generateRandomStr(16)
  const timestamp = new Date().getTime()
  const signatureFields = [
    `jsapi_ticket=${result.ticket}`,
    `noncestr=${noncestr}`,
    `timestamp=${timestamp}`,
    `url=${url}`
  ]
  const signatureStr = signatureFields.join('&')
  console.log('💯 Current SignatureStr Is: ', signatureStr)
  const signature = sha1(signatureStr)

  return $util.sendSuccess(ctx, {
    appId: secretConf.appid,
    timestamp: timestamp,
    nonceStr: noncestr,
    signature: signature
  })
}

exports.crawlLinksInfo = async (ctx, next) => {
  let options = ctx.request.query
  try {
    return await $util.getWebPageInfo(options.url).then(result => {
      $util.sendSuccess(ctx, result)
    })
  } catch (error) {
    ctx.status = 500
    ctx.body = '🐛 Opps, Something Error :' + error
  }
}
