var mongoose = require('mongoose')

//定义管理员表
const friendSchema = new mongoose.Schema({
    friendId: mongoose.Schema.Types.ObjectId,
    userId:mongoose.Schema.Types.ObjectId,
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

const friend = mongoose.model('friend', friendSchema)

module.exports = friend

