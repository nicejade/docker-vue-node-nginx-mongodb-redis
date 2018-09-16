const mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  bcrypt = require('bcrypt-nodejs')

// ================================
// User Schema
// ================================
const UserSchema = new Schema(
  {
    email: {
      type: String,
      lowercase: true,
      unique: true,
      required: true
    },
    username: {
      type: String,
      unique: true,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    profile: {
      nickname: { type: String, default: '' },
      website: { type: String, default: '' },
      description: { type: String, default: '' },
      avatar: { type: String, default: '' }
    },
    role: {
      type: String,
      enum: ['Member', 'Owner', 'Admin'],
      default: 'Member'
    },
    registeTime: {
      type: Date
    },
    activeTime: {
      type: Date
    },
    number: {
      type: Number,
      default: 1
    },
    resetPasswordToken: {
      type: String
    },
    resetPasswordExpires: {
      type: Date
    },
    active: {
      type: Boolean,
      default: false
    },
    activeToken: String,
    activeExpires: Date
  },
  {
    timestamps: true
  }
)

// Pre-save of user to database, hash password if password is modified or new
UserSchema.pre('save', function(next) {
  const user = this,
    SALT_FACTOR = 5

  if (!user.isModified('password')) return next()

  bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
    if (err) return next(err)

    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return next(err)
      user.password = hash
      next()
    })
  })
})

// Method to compare password for login
UserSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) {
      return cb(err)
    }

    cb(null, isMatch)
  })
}

module.exports = mongoose.model('UserModel', UserSchema)
