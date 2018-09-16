const passport = require('koa-passport'),
  User = require('../models/userModel'),
  config = require('./main'),
  JwtStrategy = require('passport-jwt').Strategy,
  ExtractJwt = require('passport-jwt').ExtractJwt,
  LocalStrategy = require('passport-local')

const localOptions = { usernameField: 'email' }
// Setting up local login strategy
const localEmailLogin = new LocalStrategy(localOptions, function(
  email,
  password,
  done
) {
  User.findOne({ email: email }, function(err, user) {
    if (err) {
      return done(err)
    }
    if (!user) {
      return done(null, false, {
        error: 'Your login details could not be verified. Please try again.'
      })
    }

    user.comparePassword(password, function(err, isMatch) {
      if (err) {
        return done(err)
      }
      if (!isMatch) {
        return done(null, false, {
          error: 'Your login details could not be verified. Please try again.'
        })
      }

      return done(null, user)
    })
  })
})

const localUsernameLogin = new LocalStrategy(
  { usernameField: 'username' },
  function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
      if (err) {
        return done(err)
      }
      if (!user) {
        return done(null, false, {
          error: 'Your login details could not be verified. Please try again.'
        })
      }

      user.comparePassword(password, function(err, isMatch) {
        if (err) {
          return done(err)
        }
        if (!isMatch) {
          return done(null, false, {
            error: 'Your login details could not be verified. Please try again.'
          })
        }

        return done(null, user)
      })
    })
  }
)

const jwtOptions = {
  // Telling Passport to check authorization headers for JWT
  jwtFromRequest: ExtractJwt.fromAuthHeader(),
  // Telling Passport where to find the secret
  secretOrKey: config.secret
}

// Setting up JWT login strategy
const jwtLogin = new JwtStrategy(jwtOptions, function(payload, done) {
  User.findById(payload._id, function(err, user) {
    if (err) {
      return done(err, false)
    }

    if (user) {
      done(null, user)
    } else {
      done(null, false)
    }
  })
})

// serializeUser 在用户登录验证成功以后将会把用户的数据存储到 session 中
passport.serializeUser(function(user, done) {
  done(null, user)
})

// deserializeUser 在每次请求的时候将从 session 中读取用户对象
passport.deserializeUser(function(user, done) {
  return done(null, user)
})

passport.use(jwtLogin)
passport.use('email-local', localEmailLogin)
passport.use('username-local', localUsernameLogin)

module.exports = passport
