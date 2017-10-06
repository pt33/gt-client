let mongoose = require('mongoose')

//定义管理员表
const userSchema = new mongoose.Schema({
    username: String,
    password:String,
    surname:String,
    realname:String,
    nickname:String,
    birthday:String,
    email:String,
    phone:String,
    avatar:String,
    sex: Number,
    status:{type: Number, default: 1},
    createTime: {
        type: Date,
        default: new Date()
    },
    updateTime: {
        type: Date,
        default: new Date()
    }
})

const user = mongoose.model('user', userSchema)

module.exports = user

