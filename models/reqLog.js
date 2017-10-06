var mongoose = require('mongoose')

//定义管理员表
const reqLogSchema = new mongoose.Schema({
    ip: String,
    url: String,
    createTime: {
        type: Date,
        default: new Date()
    }// 状态：1：正常，-1：冻结, -2: 删除
})

const reqLog = mongoose.model('reqLog', reqLogSchema)

module.exports = reqLog

