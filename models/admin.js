let mongoose = require('mongoose')

//定义管理员表
const adminSchema = new mongoose.Schema({
    username: String,
    password: String,
    roleId: {
        type: mongoose.Schema.Types.ObjectId
        ,ref: 'role'
    },
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

const admin = mongoose.model('admin', adminSchema)

module.exports = admin

