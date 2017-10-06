var mongoose = require('mongoose')

//定义管理员表
const uploadLogSchema = new mongoose.Schema({
    adminId: mongoose.Schema.Types.ObjectId,
    desc: String,
    path: String,
    createTime: {
        type: Date,
        default: new Date()
    } // 状态：1：正常，-1：冻结, -2: 删除
})

const uploadLog = mongoose.model('uploadLog', uploadLogSchema)

module.exports = uploadLog

