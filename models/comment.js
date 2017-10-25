let mongoose = require('mongoose')

//定义管理员表
const commentSchema = new mongoose.Schema({
    mainId:  mongoose.Schema.Types.ObjectId,
    type: String,//news:信息,blog:日志,question:提问,book:家谱
    content: String,
    userId: mongoose.Schema.Types.ObjectId,
    replyTo:mongoose.Schema.Types.ObjectId,
    status: {type: Number, default: 1},  // 状态：1：正常，-1：冻结, -2: 删除
    createTime: {
        type: Date,
        default: () => new Date()
    },
    updateTime: {
        type: Date,
        default: () => new Date()
    }
})

const comment = mongoose.model('comment', commentSchema)

module.exports = comment

