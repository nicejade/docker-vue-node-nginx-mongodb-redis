let { Links } = require('./../models/index')
let $util = require('./../helper/util')
let _ = require('lodash')

/*------------------------------api---------------------------*/

exports.getNiceLinks = async (ctx, next) => {
  let options = $util.getQueryObject(ctx.request.url)
  let params = { active: true }
  let sortParam = {}

  options._id ? (params._id = options._id) : ''
  options.sortTarget ? (sortParam[options.sortTarget] = options.sortType) : ''

  let limitNumber = parseInt(options.pageSize)
  let skipNumber = (parseInt(options.pageCount) - 1) * limitNumber
  try {
    return await Links.find(params)
      .sort(sortParam)
      .limit(limitNumber)
      .skip(skipNumber)
      .exec()
      .then(async result => {
        /* ----------------------@Add Default----------------------*/
        if (result.length <= 0) {
          result.push({
            name: '晚晴幽草',
            address: 'https://www.jianshu.com/u/9aae3d8f4c3d',
            description:
              '产自陕南一隅，流走于深圳的小雄猿。崇文喜武，爱美人尚科技；编码砌字，当下静生活；读思旅行，期成生活静。',
            date: '2015-02-05'
          })
        }
        $util.sendSuccess(ctx, result)
      })
  } catch (error) {
    $util.sendFailure(ctx, null, 'Opps, Something Error :' + error)
  }
}

exports.addNiceLinks = async (ctx, next) => {
  let options = ctx.request.body
  if (options.role === 'Admin') {
    options.active = await $util.checkRoleByUserId(options.userId, 'Admin')
  }
  try {
    return await Links.create(options).then(async result => {
      $util.sendSuccess(ctx, result)
    })
  } catch (error) {
    if (error.code === 11000) {
      return $util.sendFailure(ctx, 'linkHaveBeenAdded')
    }
    $util.sendFailure(ctx, null, 'Opps, Something Error :' + error)
  }
}

exports.updateNiceLinks = async (ctx, next) => {
  let options = ctx.request.body
  if (options.managerRole === 'Admin') {
    let checkAdmin = await $util.checkRoleByUserId(options.managerId, 'Admin')
    if (!checkAdmin) return
  } else {
    return $util.sendFailure(
      ctx,
      null,
      'Opps, You do not have permission to control'
    )
  }
  try {
    const user = await $util.findUser({ username: options.createdBy })
    return await Links.update({ _id: options._id }, { $set: options }).then(
      async result => {
        $util.sendSuccess(ctx, result)
      }
    )
  } catch (error) {
    $util.sendFailure(ctx, null, 'Opps, Something Error :' + error)
  }
}

exports.deleteNiceLinks = async (ctx, next) => {
  let options = ctx.request.body
  let isAdmin = await $util.checkRoleByUserId(options.operatorId, 'Admin')
  if (!isAdmin) {
    return $util.sendFailure(
      ctx,
      null,
      'Opps, You do not have permission to control'
    )
  }
  try {
    return await Links.remove({ _id: options._id }).then(async result => {
      $util.sendSuccess(ctx, result)
    })
  } catch (error) {
    $util.sendFailure(ctx, null, 'Opps, Something Error :' + error)
  }
}

exports.getAllLinks = async (ctx, next) => {
  let options = ctx.request.query
  let params = { active: options.active }
  let sortParam = {}
  options.sortTarget ? (sortParam[options.sortTarget] = options.sortType) : ''

  let limitNumber = parseInt(options.pageSize)
  let skipNumber = (parseInt(options.pageCount) - 1) * limitNumber
  try {
    return await Links.find(params)
      .sort(sortParam)
      .limit(limitNumber)
      .skip(skipNumber)
      .exec()
      .then(async result => {
        $util.sendSuccess(ctx, result)
      })
  } catch (error) {
    $util.sendFailure(ctx, null, 'Opps, Something Error :' + error)
  }
}

exports.getAllLinksCount = async (ctx, next) => {
  try {
    let options = ctx.request.query
    let params = { active: options.active }
    let count = await Links.find(params).count()
    $util.sendSuccess(ctx, count)
  } catch (error) {
    $util.sendFailure(ctx, null, 'Opps, Something Error :' + error)
  }
}
