let nodemailer = require('nodemailer'),
  path = require('path'),
  fs = require('fs'),
  // secretConf = require("./../config/secret")
  secretConf = {
    email_qq: '',
    email_163: ''
  }

let typeList = {
  active: {
    title: '激活您在「倾城之链」的专属账户',
    desc:
      '欢迎您加入<a href="https://nicelinks.site">倾城之链 | NICE LINKS</a>，为了保证正常使用，请在 48 小时内，点击以按钮完成邮件验证，以激活账户。',
    button: '激活账户'
  },
  reset: {
    title: '重设您在「倾城之链」的登录密码',
    desc:
      '如果您忘记了密码，可点击下面的链接来重置密码；愿您在<a href="https://nicelinks.site">倾城之链 | NICE LINKS</a>。',
    button: '重设密码'
  },
  notice: {
    title: '来自「倾城之链」的温馨提醒',
    desc:
      'Congratulations, 您提交于<a href="https://nicelinks.site">倾城之链 | NICE LINKS</a>的优质站点，已被授意通过，您可以点击下面的按钮前往查看。',
    button: '前往访问'
  }
}

let mailTemp = fs.readFileSync(
  path.join(__dirname, './../../views/mailTemp.html'),
  { encoding: 'utf-8' }
)

let sendMail = (params = {}) => {
  const htmlBody = mailTemp
    .replace('#DESC#', typeList[params.type].desc)
    .replace('#BUTTON#', typeList[params.type].button)
    .replace('#LINK#', params.link)

  const subject = typeList[params.type].title

  // 对于是使用“QQ”邮箱注册用户，则使用"QQ"邮箱发送激活邮件；其他则 163 邮箱；
  const isQQRegister = params.to.indexOf('@qq.com') > -1
  const authConf = isQQRegister ? secretConf.email_qq : secretConf.email_163

  const smtpTransport = nodemailer.createTransport({
    host: isQQRegister ? 'smtp.qq.com' : 'smtp.163.com',
    secure: true,
    auth: {
      user: authConf.account,
      pass: authConf.password
    }
  })

  smtpTransport.sendMail(
    {
      from: params.from || `倾城之链<${authConf.account}>`,
      to: params.to,
      subject: subject,
      html: htmlBody || 'https://nicelinks.site'
    },
    function(err, res) {
      if (err) {
        console.log(err, res)
      } else {
        params.callback && params.callback()
      }
    }
  )
}

module.exports = sendMail
