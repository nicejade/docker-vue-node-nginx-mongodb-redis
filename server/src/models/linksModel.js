let mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = mongoose.Schema.ObjectId

/* Solve Problem: (node) DeprecationWarning:
  Mongoose: mpromise (mongoose's default promise library) is deprecated
*/
mongoose.Promise = global.Promise

// 定义 LinksSchema 数据表和数据结构
const LinksSchema = new mongoose.Schema({
  path: {
    type: String,
    lowercase: true,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  desc: {
    type: String,
    default: ''
  },
  keywords: {
    type: String,
    default: ''
  },
  active: {
    type: Boolean,
    default: false
  },
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Links', LinksSchema)
